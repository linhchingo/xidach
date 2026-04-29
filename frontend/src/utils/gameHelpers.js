/**
 * Tính số ván đã chơi cho 1 người chơi dựa trên lịch sử các rounds.
 * Player được tính là đã chơi nếu là host hoặc có kết quả trong round đó.
 *
 * @param {number} playerId - ID người chơi
 * @param {Array} roundHistory - Danh sách các round đã hoàn thành
 * @returns {number} Số ván đã tham gia
 */
export function countRoundsPlayed(playerId, roundHistory) {
  return roundHistory.filter(r =>
    r.status === 'completed' &&
    (r.host_player_id === playerId ||
      (r.results && r.results.some(res => res.player_id === playerId)))
  ).length;
}
