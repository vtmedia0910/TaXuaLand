# Xác minh, nguồn và độ mới

Nguồn OFFICIAL/LAND_OBSERVED/PARTNER/THIRD_PARTY/LEGACY_IMPORT/UNKNOWN là **thẩm quyền nguồn**. VERIFIED/DECLARED/UNKNOWN/EXPIRED là **trạng thái bằng chứng**. PUBLISHED/DRAFT/ARCHIVED là **xuất bản**. Ba nhóm không thay thế nhau. Nguồn chính thức hoặc địa điểm đã công khai vẫn có thể có vị trí UNKNOWN.

Người có quyền `verify` chỉ chọn VERIFIED khi có bản ghi bằng chứng đang khả dụng, phương pháp kiểm tra, thời điểm hợp lệ và policy độ mới. App ghi actor/thời gian phía server. Trường độ chính xác ngang đơn vị mét phải dựa trên bằng chứng đo; không suy ra từ số chữ số thập phân, GPS pin, DEM resolution hoặc round-trip CRS. Thiếu bằng chứng để UNKNOWN; khai báo của nguồn có thể DECLARED nếu được ghi rõ.

Kiểm tra LOCATION, ACCESS và SAFETY độc lập. Vị trí đúng không chứng minh đường đi hợp lệ hoặc điều kiện an toàn. Kiểm tra thực địa cần phương pháp, thiết bị, datum và phạm vi quan sát phù hợp; ghi observed date riêng với ngày import. Nếu thông tin có thể thay đổi, chọn EXPIRES và ngày hết hạn phù hợp với bằng chứng. UNKNOWN không tự trở thành EXPIRED; dữ liệu có trạng thái được khai báo/xác minh hết hạn sẽ hiển thị EXPIRED mà không sửa mất lịch sử.

Sửa tọa độ đóng khoảng hiệu lực geometry cũ và tạo quan sát mới UNKNOWN. Xác minh vị trí cũng thêm geometry history; bản đã xác minh trước vẫn được giữ để đối chiếu. Import UPDATE giữ snapshot nội dung/geometry trước, không kế thừa VERIFIED sang observation nhập mới. Thao tác xác minh đưa địa điểm về draft/review; publisher xem lại trước khi công bố.

DEM Phase 0 là Copernicus DSM đã xử lý sang cao độ ellipsoid bằng grid EGM2008 xác định. Kiểm tra checksum, seam và số học chứng minh quá trình xử lý nhất quán, **không** đo sai số tuyệt đối tại Tà Xùa. Mốc đường OSM trong QA chỉ kiểm tra tương quan với nguồn, không phải mốc trắc địa khảo sát. `TX-AOI-DEMO-001` là hộp coverage vận hành, không phải ranh hành chính/pháp lý. Control points thực địa và độ chính xác địa phương hiện UNKNOWN.
