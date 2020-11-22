const nowInSecs = () => Math.floor(Date.now() / 1000)

module.exports = {
  tokenEmission: () => nowInSecs(),
  tokenDuration: () => nowInSecs() + (60 * 60 * 24 * 10), // 10 days
  nowInSecs
}
