"""
Script cập nhật dữ liệu GA4 tự động cho GitHub Actions
Dự án: Chạm Di Sản | GA4 Data Visual Live Dashboard
Quy tắc:
1. Đọc khóa Service Account từ GitHub Secret: GA4_SERVICE_ACCOUNT_JSON.
2. Lấy dữ liệu từ mốc chuyển giao 18/11/2026 đến ngày hôm qua (yesterday).
3. Lookback quét lại 7 ngày gần nhất để cập nhật dữ liệu GA4 gửi muộn (late-arriving events).
4. Cập nhật dữ liệu vào data/dashboard_data.json theo cơ chế idempotent (không ghi trùng).
5. Nếu API gặp sự cố, giữ nguyên dữ liệu lịch sử thành công trước đó, ghi cảnh báo và không làm hỏng file.
"""

import os
import sys
import json
from datetime import datetime, date, timedelta, timezone

ICT = timezone(timedelta(hours=7))
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "563712293")
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "dashboard_data.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Data file not found at: {DATA_FILE}")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    # Cập nhật song song file JS cho chế độ offline/file:// preview
    js_file = os.path.join(os.path.dirname(DATA_FILE), "dashboard_data.js")
    with open(js_file, "w", encoding="utf-8") as f:
        f.write("window.CHAM_DI_SAN_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")

def main():
    print("==========================================================")
    print("🚀 GITHUB ACTIONS: GA4 DATA API SYNC")
    print(f"Property ID: {PROPERTY_ID}")
    print("==========================================================")

    data = load_data()
    
    sa_json_str = os.environ.get("GA4_SERVICE_ACCOUNT_JSON")
    if not sa_json_str:
        print("⚠️ GA4_SERVICE_ACCOUNT_JSON secret is not set.")
        print("Giữ nguyên dữ liệu hiện tại, không làm gián đoạn dashboard.")
        sys.exit(0)

    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import (
            DateRange, Dimension, Metric, RunReportRequest
        )
        from google.oauth2 import service_account

        sa_info = json.loads(sa_json_str)
        credentials = service_account.Credentials.from_service_account_info(sa_info)
        client = BetaAnalyticsDataClient(credentials=credentials)
        print("✓ Khởi tạo Google Analytics Data Client thành công.")

        # Xác định khoảng ngày đồng bộ
        cutover_date = date(2026, 11, 18)
        now_vn = datetime.now(ICT)
        today_vn = now_vn.date()
        yesterday_vn = today_vn - timedelta(days=1)

        if yesterday_vn < cutover_date:
            print("Chưa đến mốc ngày cần cập nhật GA4.")
            sys.exit(0)

        # Lùi lại 7 ngày để xử lý sự kiện đến muộn
        lookback_days = 7
        start_date = max(cutover_date, yesterday_vn - timedelta(days=lookback_days))
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = yesterday_vn.strftime("%Y-%m-%d")

        print(f"📡 Đang truy vấn GA4 từ {start_date_str} đến {end_date_str} (Lookback: {lookback_days} ngày)...")

        # 1. Truy vấn Daily Metrics
        daily_req = RunReportRequest(
            property=f"properties/{PROPERTY_ID}",
            dimensions=[Dimension(name="date")],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagedSessions"),
                Metric(name="engagementRate"),
                Metric(name="averageSessionDuration"),
            ],
            date_ranges=[DateRange(start_date=start_date_str, end_date=end_date_str)],
        )
        daily_res = client.run_report(daily_req)

        # Tạo bản đồ các ngày thực tế từ GA4
        ga4_days = {}
        for row in daily_res.rows:
            raw_d = row.dimension_values[0].value
            d_fmt = f"{raw_d[:4]}-{raw_d[4:6]}-{raw_d[6:]}"
            ga4_days[d_fmt] = {
                "active_users": int(row.metric_values[0].value),
                "sessions": int(row.metric_values[1].value),
                "page_views": int(row.metric_values[2].value),
                "engaged_sessions": int(row.metric_values[3].value),
                "engagement_rate": float(row.metric_values[4].value),
                "average_session_duration": float(row.metric_values[5].value),
            }

        # Cập nhật danh sách website_daily trong dashboard_data.json
        existing_daily_map = {item["date"]: item for item in data.get("website_daily", [])}

        curr_d = cutover_date
        while curr_d <= yesterday_vn:
            d_str = curr_d.strftime("%Y-%m-%d")
            metrics = ga4_days.get(d_str, {
                "active_users": 0, "sessions": 0, "page_views": 0,
                "engaged_sessions": 0, "engagement_rate": 0.0, "average_session_duration": 0.0
            })

            if d_str in existing_daily_map:
                # Cập nhật ngày đã có
                existing_daily_map[d_str].update({
                    "active_users": metrics["active_users"],
                    "sessions": metrics["sessions"],
                    "page_views": metrics["page_views"],
                    "data_source": "GA4 Tự động (Google Analytics Live)",
                    "sync_type": "Động (GA4 Daily API - GitHub Actions)"
                })
            else:
                # Bổ sung ngày mới
                existing_daily_map[d_str] = {
                    "date": d_str,
                    "active_users": metrics["active_users"],
                    "sessions": metrics["sessions"],
                    "page_views": metrics["page_views"],
                    "data_source": "GA4 Tự động (Google Analytics Live)",
                    "sync_type": "Động (GA4 Daily API - GitHub Actions)",
                    "period": f"{d_str}/{d_str}",
                    "original_source": f"GA4 Property {PROPERTY_ID}"
                }
            curr_d += timedelta(days=1)

        # Sắp xếp lại theo thứ tự ngày tăng dần
        sorted_daily = sorted(existing_daily_map.values(), key=lambda x: x["date"])
        data["website_daily"] = sorted_daily

        # 2. Truy vấn Traffic Sources
        sources_req = RunReportRequest(
            property=f"properties/{PROPERTY_ID}",
            dimensions=[
                Dimension(name="date"),
                Dimension(name="sessionSource"),
                Dimension(name="sessionMedium"),
            ],
            metrics=[
                Metric(name="sessions"),
                Metric(name="activeUsers"),
            ],
            date_ranges=[DateRange(start_date=start_date_str, end_date=end_date_str)],
        )
        sources_res = client.run_report(sources_req)

        live_sources = []
        for row in sources_res.rows:
            raw_d = row.dimension_values[0].value
            d_fmt = f"{raw_d[:4]}-{raw_d[4:6]}-{raw_d[6:]}"
            src = row.dimension_values[1].value
            med = row.dimension_values[2].value
            sess = int(row.metric_values[0].value)
            users = int(row.metric_values[1].value)
            live_sources.append({
                "date": d_fmt,
                "session_source": src,
                "session_medium": med,
                "sessions": sess,
                "active_users": users
            })
        data["ga4_sources_live"] = live_sources

        # Cập nhật metadata
        now_str = now_vn.strftime("%Y-%m-%d %H:%M:%S+07:00")
        data["metadata"]["last_updated_at"] = now_str
        data["metadata"]["latest_ga4_date"] = end_date_str
        data["metadata"]["sync_status"] = "SUCCESS"
        data["metadata"]["data_sources"]["live_ga4_period"] = f"2026-11-18 đến {end_date_str} (Google Analytics 4 Data API Live)"

        save_data(data)
        print(f"🎉 Cập nhật thành công! Tổng số ngày hiện có: {len(sorted_daily)} (Đến ngày {end_date_str}).")

    except Exception as e:
        print(f"❌ Lỗi khi cập nhật GA4 qua API: {e}")
        # Giữ nguyên dữ liệu cũ, chỉ cập nhật warning vào metadata
        try:
            data["metadata"]["sync_warning"] = f"Lỗi đồng bộ gần nhất lúc {datetime.now(ICT).strftime('%Y-%m-%d %H:%M:%S')}: {e}"
            save_data(data)
        except Exception:
            pass
        # Exit with 0 so the workflow does not break the GitHub Pages deployment
        sys.exit(0)

if __name__ == "__main__":
    main()
