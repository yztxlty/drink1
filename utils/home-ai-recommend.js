const HOME_AI_RECOMMENDATION = {
  storageKey: 'home_ai_chat_recommend_hidden_until',
  appId: 'wx29c58f03b1322e0e',
  path: '',
  sourceLink: '#小程序://幽光Ai伴侣/IeNvypurIqnBEUh',
  title: 'AI 聊天推荐',
  subtitle: '专属AI陪伴，随心聊天、倾诉、解忧，更懂你的情绪小助手～',
  hint: '想聊的时候，去轻轻说说话吧',
  actionLabel: '打开试试',
  closeLabel: '×',
  badgeLabel: 'AI',
  cooldownMs: 2 * 60 * 60 * 1000
};

module.exports = {
  HOME_AI_RECOMMENDATION,
  ...HOME_AI_RECOMMENDATION,
  copy: {
    title: HOME_AI_RECOMMENDATION.title,
    subtitle: HOME_AI_RECOMMENDATION.subtitle,
    hint: HOME_AI_RECOMMENDATION.hint,
    actionLabel: HOME_AI_RECOMMENDATION.actionLabel,
    closeLabel: HOME_AI_RECOMMENDATION.closeLabel,
    badgeLabel: HOME_AI_RECOMMENDATION.badgeLabel
  }
};
