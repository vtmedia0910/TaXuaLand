# Hướng dẫn vận hành Phase 0

TÀ XÙA LAND dùng repo, database và tài khoản riêng. Đọc [triển khai](deployment.md) trước khi mở dịch vụ ra Internet. Không dùng credential TÀ XÙA BIKER/TRIP, không nhập key vào sheet hoặc trang nguồn dữ liệu.

## Công việc hằng ngày

1. Đăng nhập `/admin`. Mở **Chẩn đoán** để kiểm tra database, nguồn/provider, release và các batch import gần nhất. UNKNOWN không đồng nghĩa với hoạt động tốt hoặc đã xác minh. Nút **Kiểm tra viewer** đo trình duyệt đang dùng; dừng kiểm tra sẽ giải phóng Cesium.
2. Mở **Địa điểm** và lọc bản nháp, thiếu tọa độ, nguồn, danh mục hoặc trạng thái xác minh. Thêm địa điểm với nguồn cụ thể; thiếu thông tin thì để trống/UNKNOWN. Dùng checkbox danh mục hiện có hoặc tạo danh mục khi có quyền sửa.
3. Nhập kinh độ/vĩ độ WGS84 vào đúng trường. Nút đưa camera tới vị trí đề xuất giúp đối chiếu; nhấp bản đồ hoặc kéo điểm vàng chỉ đổi ứng viên. So sánh với vị trí đã lưu và lịch sử xác minh, đọc cảnh báo AOI/đường. Khoảng cách tới đường không chứng minh khả năng tiếp cận.
4. Lưu bản nháp. Sửa tọa độ đã có cần xác nhận riêng và tạo lịch sử geometry mới UNKNOWN. Mỗi lần sửa có version; nếu người khác vừa sửa, tải lại và đối chiếu thay vì ghi đè.
5. Điền thông tin tham quan, tiếp cận, an toàn và metadata ảnh/video/liên kết với nguồn phù hợp. Link phải HTTPS, không có user/password. Không nhập dữ liệu nhạy cảm vào trường có thể xuất bản. Metadata link không tự cấp quyền sử dụng ảnh.
6. Người có quyền xác minh làm theo [hướng dẫn xác minh](verification-guide.md). Người có quyền xuất bản rà soát bản hiện tại, nguồn, danh mục, vị trí, trạng thái xác minh và cảnh báo trước khi bấm **Xuất bản địa điểm**. Có thể công bố UNKNOWN sau rà soát rõ ràng theo policy Phase 0; không đổi nhãn thành VERIFIED để vượt gate.
7. Mở `/map`, tìm tên có/không dấu, lọc danh mục, chọn điểm, kiểm tra fly-to và chi tiết/URL chia sẻ. Bản nháp/archived/nguồn không khả dụng không được hiển thị công khai. Lưu trữ địa điểm khi cần gỡ, giữ nguyên history/audit.

Import số lượng lớn có quy trình riêng tại [Excel import](admin-import-guide.md). Bulk archive/publish tối đa 50 mục, cần xác nhận; một mục lỗi làm rollback cả lô.

## Sự cố và bảo trì

Lấy correlation ID từ phản hồi lỗi API và đối chiếu log JSON/audit. Không gửi nguyên cookie, trace đăng nhập, workbook hoặc `.env` vào issue. Với lỗi terrain/checksum, dừng dùng vùng thiếu dữ liệu để đánh giá; tìm kiếm/chi tiết vẫn dùng được. Không thay bằng địa hình mô hình hóa thủ công. Với lỗi quyền, kiểm tra role hiện tại và phiên hết hạn; không cấp quyền owner cho app để chữa lỗi.

Chạy cleanup file import hết hạn hằng ngày bằng `node --env-file=<operator-env> infra/expire-import-files.mjs` từ repo, với `LAND_WORKSPACE_ROOT` đúng. Lệnh chỉ xóa file inspection hết hạn/orphan hơn bảy ngày; batch, provenance và audit vẫn còn. Kiểm tra dung lượng private volume, dung lượng log, lỗi DB, latency và batch bị treo. Dùng [observability](observability.md) để đọc các chỉ số.

Backup database và asset manifest theo lịch của đơn vị vận hành, lưu mã hóa với quyền hạn chế. Thực hành `infra/verify-backup.mjs` trên bản local cô lập trước khi đổi migration/runtime lớn. Không restore lên database đang phục vụ. Dừng ghi trong thời gian tạo baseline kiểm tra count hoặc dùng snapshot nhất quán. Mọi thay đổi source/provider/AOI ngoài UI là thao tác operator có kiểm soát, phải lưu người thực hiện và lý do.
