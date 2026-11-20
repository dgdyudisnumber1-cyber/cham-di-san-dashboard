"""Đồng bộ các ngày GA4 đã kết thúc và xuất dữ liệu tĩnh cho Dashboard."""

import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ICT = timezone(timedelta(hours=7))
CUTOVER = date(2026, 11, 18)
LOOKBACK_DAYS = 7
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "563712293")
DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "dashboard_data.json"
DAILY_METRICS = ("activeUsers", "sessions", "screenPageViews")
DAILY_FIELDS = ("active_users", "sessions", "page_views")
PAGE_SIZE = 10_000


class IncompleteReport(Exception):
    """Báo cáo không đủ để xác nhận số liệu cần cập nhật."""


def dates_between(start, end):
    return (start + timedelta(days=index) for index in range((end - start).days + 1))


def query_report(client, start, end, dimensions, metrics):
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Metric, OrderBy, RunReportRequest,
    )

    rows = []
    expected_count = None
    while True:
        report = client.run_report(RunReportRequest(
            property=f"properties/{PROPERTY_ID}",
            date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
            dimensions=[Dimension(name=name) for name in dimensions],
            metrics=[Metric(name=name) for name in metrics],
            order_bys=[
                OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name=name))
                for name in dimensions
            ],
            offset=len(rows),
            limit=PAGE_SIZE,
            keep_empty_rows=True,
        ))
        metadata = report.metadata
        if (metadata.subject_to_thresholding or metadata.data_loss_from_other_row
                or metadata.sampling_metadatas):
            raise IncompleteReport("GA4 báo đã giới hạn hoặc lấy mẫu dữ liệu.")
        if expected_count is None:
            expected_count = report.row_count
        if report.row_count != expected_count:
            raise IncompleteReport("Số dòng GA4 thay đổi trong lúc phân trang.")
        if not report.rows and len(rows) < expected_count:
            raise IncompleteReport("Thiếu dòng GA4 trong lúc phân trang.")
        for row in report.rows:
            values = tuple(value.value for value in row.dimension_values)
            counts = tuple(int(value.value) for value in row.metric_values)
            if len(values) != len(dimensions) or len(counts) != len(metrics) or min(counts) < 0:
                raise IncompleteReport("GA4 trả về dòng dữ liệu sai cấu trúc.")
            rows.append((values, counts))
        if len(rows) == expected_count:
            return rows
        if len(rows) > expected_count:
            raise IncompleteReport("Số dòng GA4 thực nhận khác số dòng công bố.")


def sync_ga4(data, client, now_vn):
    end = now_vn.date() - timedelta(days=1)
    if end < CUTOVER:
        return None

    existing = {date.fromisoformat(row["date"]): row for row in data["website_daily"]}
    missing = next((day for day in dates_between(CUTOVER, end) if day not in existing), end)
    start = max(CUTOVER, min(missing, end - timedelta(days=LOOKBACK_DAYS - 1)))
    print(f"Truy vấn GA4 từ {start} đến {end}.", flush=True)

    daily = {}
    for (raw_date,), counts in query_report(client, start, end, ("date",), DAILY_METRICS):
        day = datetime.strptime(raw_date, "%Y%m%d").date()
        if not start <= day <= end or day in daily:
            raise IncompleteReport("Ngày trong báo cáo GA4 bị trùng hoặc ngoài phạm vi.")
        daily[day] = counts

    for day in dates_between(start, end):
        if any(daily.get(day, ())):
            continue
        # Xác nhận ngày thiếu bằng báo cáo riêng và kiểm tra tổng sự kiện trước khi ghi 0.
        totals = query_report(client, day, day, (), (*DAILY_METRICS, "eventCount"))
        if len(totals) != 1:
            raise IncompleteReport(f"Chưa xác nhận được dữ liệu cho ngày {day}.")
        _, counts = totals[0]
        if not any(counts[:3]) and counts[3] != 0:
            raise IncompleteReport(f"GA4 vẫn ghi nhận sự kiện vào ngày {day}.")
        daily[day] = counts[:3]

    sources = []
    source_keys = set()
    source_sessions = {}
    for values, counts in query_report(
        client, start, end, ("date", "sessionSource", "sessionMedium"), ("sessions", "activeUsers"),
    ):
        raw_date, source, medium = values
        day = datetime.strptime(raw_date, "%Y%m%d").date()
        if day not in daily or values in source_keys:
            raise IncompleteReport("Dòng nguồn truy cập bị trùng hoặc ngoài phạm vi.")
        source_keys.add(values)
        sessions, users = counts
        source_sessions[day] = source_sessions.get(day, 0) + sessions
        sources.append({
            "date": str(day), "session_source": source, "session_medium": medium,
            "sessions": sessions, "active_users": users,
        })

    for day, counts in daily.items():
        sessions = counts[1]
        if source_sessions.get(day, 0) != sessions:
            raise IncompleteReport(f"Tổng phiên theo nguồn không khớp báo cáo ngày {day}.")

    for day, counts in daily.items():
        day_text = str(day)
        existing[day] = {
            "date": day_text,
            "period": f"{day_text}/{day_text}",
            "original_source": f"GA4 Property {PROPERTY_ID}",
            **existing.get(day, {}),
            **dict(zip(DAILY_FIELDS, counts)),
            "data_source": "Google Analytics Data API",
            "sync_type": "Động (GA4 Daily API - GitHub Actions)",
        }
    kept_sources = [
        row for row in data.get("ga4_sources_live", [])
        if not str(start) <= row["date"] <= str(end)
    ]
    metadata = data["metadata"]
    latest = max(day for day in existing if day >= CUTOVER)
    return {
        **data,
        "website_daily": [existing[day] for day in sorted(existing)],
        "ga4_sources_live": sorted(
            kept_sources + sources,
            key=lambda row: (row["date"], -row["sessions"], row["session_source"], row["session_medium"]),
        ),
        "metadata": {
            **{key: value for key, value in metadata.items() if key not in {"sync_warning", "sync_error"}},
            "last_updated_at": now_vn.isoformat(sep=" ", timespec="seconds"),
            "latest_ga4_date": str(latest),
            "sync_status": "SUCCESS",
            "data_sources": {
                **metadata["data_sources"],
                "live_ga4_period": f"{CUTOVER} đến {latest} (Google Analytics Data API)",
            },
        },
    }


def main():
    try:
        secret = os.environ.get("GA4_SERVICE_ACCOUNT_JSON")
        if not secret:
            raise IncompleteReport("Thiếu cấu hình xác thực GA4 trong GitHub Actions.")

        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.oauth2 import service_account

        credentials = service_account.Credentials.from_service_account_info(json.loads(secret))
        client = BetaAnalyticsDataClient(credentials=credentials)
        updated = sync_ga4(json.loads(DATA_FILE.read_text(encoding="utf-8")), client, datetime.now(ICT))
        if updated is None:
            print("Chưa có ngày GA4 nào đã kết thúc kể từ mốc chuyển giao.")
            return 0

        payload = json.dumps(updated, indent=2, ensure_ascii=False)
        DATA_FILE.write_text(payload, encoding="utf-8")
        DATA_FILE.with_suffix(".js").write_text(
            "window.CHAM_DI_SAN_DATA = " + payload + ";\n", encoding="utf-8",
        )
        print(f"Đã đồng bộ {len(updated['website_daily'])} ngày. Mốc GA4: {updated['metadata']['latest_ga4_date']}.")
        return 0
    except IncompleteReport as error:
        print(f"::error::{error}")
    except Exception as error:
        # Không in thông báo thô của thư viện xác thực và API.
        print(f"::error::Đồng bộ GA4 thất bại ({type(error).__name__}).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
