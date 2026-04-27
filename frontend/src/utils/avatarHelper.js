/**
 * Chuẩn hóa tên: chuyển về chữ thường, bỏ dấu tiếng Việt, tách thành mảng các từ.
 */
export const normalizeName = (name) => {
  if (!name) return [];
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/đ/g, 'd')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
};

/**
 * Bảng ánh xạ từ khóa với tên tệp ảnh trong src/assets/avatars/
 * Ví dụ: 'thang': 'abc.png'
 */
export const avatarMapping = {
  // Thêm các ánh xạ của bạn ở đây
  // 'thang': 'abc.png',
  'nghia': 'nghia.jpg',
  'dong': 'dong.jpg',
  'hiep': 'hiep.jpg',
  'ngan': 'ngan.jpg',
  'hieu': 'hieu.jpg',
  'nga': 'nga.jpg',
  'trang': 'trang.jpg',
  'tien': 'tien.jpg',
  'hung': 'hung.jpg',
  'san': 'san.jpg',
  'ta': 'ta.jpg'
};

/**
 * Lấy tên tệp ảnh khớp với bất kỳ từ nào trong tên người chơi.
 */
export const getAvatarFileName = (name) => {
  const words = normalizeName(name);
  for (const word of words) {
    if (avatarMapping[word]) {
      return avatarMapping[word];
    }
  }
  return null;
};

/**
 * Lấy chữ cái đầu (Initials) từ tên.
 * Ví dụ: "Lê Thắng" -> "LT", "Thắng" -> "TH"
 */
export const getInitials = (name) => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};
