# CHẠM DI SẢN | DIGITAL PERFORMANCE DASHBOARD
## Báo cáo Hiệu suất Số Đa Kênh: Website (GA4 Live), TikTok Content & Facebook Marketing

> **Đường dẫn Public Dashboard (GitHub Pages):** [https://dgdyudisnumber1-cyber.github.io/cham-di-san-dashboard/](https://dgdyudisnumber1-cyber.github.io/cham-di-san-dashboard/)  
> **Mã nguồn Repository:** [https://github.com/dgdyudisnumber1-cyber/cham-di-san-dashboard](https://github.com/dgdyudisnumber1-cyber/cham-di-san-dashboard)  
> **Google Analytics 4 Property ID:** `563712293`  
> **Thời gian báo cáo:** Từ ngày `05/10/2026` đến liên tục cập nhật theo ngày mới nhất.

---

## 1. MỤC TIÊU & TỔNG QUAN HỆ THỐNG

Dự án **Chạm Di Sản** là chiến dịch truyền thông bảo tồn và lan tỏa giá trị di sản văn hóa truyền thống Việt Nam thông qua hệ sinh thái đa kênh (Website chính thức, TikTok Channel và Fanpage Facebook).

Bảng điều khiển trực tuyến này được xây dựng nhằm cung cấp cho Giảng viên và Hội đồng chấm thi khả năng:
1. **Truy cập 24/7 độc lập hoàn toàn:** Không phụ thuộc vào máy tính cá nhân của sinh viên, không cần mở Docker, PostgreSQL hay Metabase localhost.
2. **Theo dõi dữ liệu thực tế tự động cập nhật:** Tích hợp **GitHub Actions** tự động gọi **Google Analytics 4 Data API** hằng ngày vào lúc 09:00 AM (giờ Việt Nam) để thu thập dữ liệu mới, cập nhật chuỗi thời gian và tự động tái triển khai website mà không tốn bất kỳ chi phí nào (100% Free Tier).
3. **Đối chiếu số liệu kiểm toán minh bạch:** Tái hiện trung thực 100% cấu trúc 5 Tab và 34 chỉ số / biểu đồ từ Metabase Dashboard gốc.

---

## 2. HƯỚNG DẪN DÀNH CHO GIẢNG VIÊN & NGƯỜI ĐÁNH GIÁ

### A. Cấu trúc 5 Tab phân tích
Dashboard được chia làm 5 phân hệ chuyên sâu theo thanh điều hướng phía trên:
* **Tab 1 — Tổng quan (Overview - 8 Cards):** Bức tranh toàn cảnh về lưu lượng Website, lượt xem video TikTok, tương tác mạng xã hội, phân loại lượt xem đa nền tảng và so sánh hiệu quả giữa Facebook và TikTok.
* **Tab 2 — Website GA4 (8 Cards):** Đi sâu vào hành vi người dùng trên website: Người dùng hoạt động TB/ngày, số trang xem trên mỗi phiên, nhịp độ truy cập, cơ cấu nguồn truy cập (Traffic Sources), Top 10 trang được xem nhiều nhất, các sự kiện tương tác và chuyển đổi mục tiêu.
* **Tab 3 — Facebook (6 Cards):** Đo lường hiệu quả 19 bài đăng Fanpage: Xếp hạng bài viết theo lượt xem, lượt click chuyển đổi về Website, cơ cấu tương tác và diễn biến theo thời gian.
* **Tab 4 — TikTok (6 Cards):** Đánh giá 8 video chính thức và 1 bài ảnh: Lượt xem trung bình mỗi video (478 views), tỷ lệ tương tác ER (3.69%), cơ cấu 4 hành vi tương tác (Thích, Lưu, Bình luận, Chia sẻ) và tương quan thời lượng video.
* **Tab 5 — Đánh giá KPI (6 Cards + Bảng chi tiết):** Bảng tổng hợp đối chiếu 9 chỉ số KPI cốt lõi đã cam kết, tỷ lệ đạt theo từng nền tảng, mức độ hoàn thành so với ngưỡng chuẩn 100% và khoảng cách tối thiểu cần bù đắp.

### B. Sử dụng bộ lọc tương tác
* **Bộ lọc thời gian (Global Date Filter):** Nằm tại góc trên bên phải thanh tiêu đề:
  * *Toàn kỳ:* Xem toàn bộ dữ liệu từ 05/10/2026 đến ngày mới nhất.
  * *Kỳ lịch sử:* Lọc riêng 44 ngày đối chiếu kiểm toán (05/10/2026 – 17/11/2026).
  * *Kỳ GA4 Live mới:* Lọc riêng các ngày dữ liệu mới được đồng bộ qua API.
  * *7 ngày / 14 ngày / 30 ngày gần nhất:* Xem nhịp độ hoạt động gần nhất.
* **Chức năng In / Lưu Snapshot PDF:** Nhấp nút `In / PDF` để xuất toàn bộ báo cáo sang định dạng văn bản in hoặc PDF lưu trữ dự phòng.

---

## 3. PHƯƠNG PHÁP ĐO LƯỜNG & MINH BẠCH DỮ LIỆU KIỂM TOÁN

Nhằm đảm bảo tính trung thực khoa học, hệ thống tuân thủ nghiêm ngặt các nguyên tắc kiểm toán:
1. **Phân định rõ 2 giai đoạn dữ liệu Website:**
   * **Giai đoạn Lịch sử (05/10/2026 – 17/11/2026, 44 ngày):** Dữ liệu kế thừa nguyên bản từ hồ sơ PDF/CSV gốc: **3.741 phiên**, **8.925 lượt xem trang**, và **3.060 người dùng-ngày**.
   * **Giai đoạn GA4 Live (từ 18/11/2026 trở đi):** Thu thập trực tiếp từ Google Analytics 4 Property `563712293` qua API chính thức.
2. **Quy chuẩn chỉ số Người dùng Website:**
   * Chỉ số **3.060** là **tổng người dùng-ngày cộng dồn (Daily Active Users)** trong 44 ngày, không được hiểu là người dùng duy nhất toàn kỳ (Unique Visitors) do Google Analytics không cộng gộp danh tính người dùng xuyên suốt các ngày khác nhau trong file thống kê phẳng.
3. **Chênh lệch 279 phiên trong báo cáo nguồn:**
   * Bảng phân loại nguồn truy cập lịch sử (`traffic_sources`) ghi nhận tổng cộng **3.462 phiên**, có độ chênh lệch 279 phiên so với tổng phiên toàn Website (**3.741 phiên**). Đây là chênh lệch có sẵn trong báo cáo gốc bên thứ ba do chưa phân loại hết các phiên trực tiếp và được giữ nguyên để bảo đảm tính khách quan.
4. **Không nhân bản số liệu (Zero Fake Data):**
   * Mọi biểu đồ đều hiển thị số liệu nguyên bản; tuyệt đối loại bỏ các phép nhân chia nhân tạo chỉ nhằm mục đích làm đẹp tỷ lệ biểu đồ.

---

## 4. KIẾN TRÚC TỰ HÀNH ĐỘC LẬP (GITHUB ACTIONS)

```
┌────────────────────────────────────────────────────────┐
│ Google Analytics 4 (Cloud)                             │
│ Property ID: 563712293                                 │
└───────────────────────────┬────────────────────────────┘
                            │ (GA4 Data API v1beta)
                            ▼
┌────────────────────────────────────────────────────────┐
│ GitHub Actions Cloud Runner (Ubuntu Latest)             │
│ Lịch chạy: Hằng ngày lúc 09:00 AM ICT (02:00 UTC)      │
│ • Lookback 7 ngày để bắt trọn sự kiện gửi muộn         │
│ • Cập nhật dữ liệu vào data/dashboard_data.json       │
│ • Kiểm tra lỗi API & chống ghi đè dữ liệu lịch sử      │
└───────────────────────────┬────────────────────────────┘
                            │ (Git Auto Commit & Push)
                            ▼
┌────────────────────────────────────────────────────────┐
│ GitHub Pages (HTTPS CDN Hosting)                       │
│ URL: https://dgdyudisnumber1-cyber.github.io/...      │
│ Phục vụ Dashboard HTML5/CSS3/Chart.js 24/7            │
└────────────────────────────────────────────────────────┘
```

---

## 5. CHỨNG MINH AN TOÀN & BẢO MẬT (SECURITY AUDIT)

* **Không chứa Secrets trong Git:** Toàn bộ mã nguồn trên repository này chỉ chứa mã giao diện HTML/CSS/JavaScript và file dữ liệu tổng hợp `dashboard_data.json`.
* **Không lưu trữ file `.env`, mật khẩu cơ sở dữ liệu hay khóa Service Account:** Khóa xác thực GA4 chỉ được lưu trữ dưới dạng **GitHub Encrypted Secrets** (tiêu chuẩn mã hóa NaCl Box) được quản lý riêng bởi GitHub và chỉ cung cấp cho runner trong thời gian thực thi tác vụ.
* **Chi phí:** 0 VNĐ (Không kích hoạt Billing, sử dụng hạn mức miễn phí chính thức của Google Cloud và GitHub).
