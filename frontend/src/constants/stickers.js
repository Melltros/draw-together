export const STICKER_CATEGORIES = [
  {
    id: 'faces',
    label: 'Faces',
    stickers: ['😀', '😂', '🥰', '😎', '🤔', '😭', '🥳', '😴', '🤩', '😇', '🙃', '😤']
  },
  {
    id: 'hearts',
    label: 'Love',
    stickers: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💕', '💖', '💘', '💝', '✨']
  },
  {
    id: 'fun',
    label: 'Fun',
    stickers: ['🔥', '⭐', '💯', '👍', '👎', '👀', '💀', '🎉', '🎨', '🌈', '⚡', '💥']
  },
  {
    id: 'nature',
    label: 'Nature',
    stickers: ['🌸', '🌻', '🌺', '🍀', '🌿', '🌙', '☀️', '🌊', '🦋', '🐝', '🍄', '🌵']
  },
  {
    id: 'food',
    label: 'Food',
    stickers: ['🍕', '🍔', '🍩', '🍰', '☕', '🧋', '🍓', '🍉', '🌮', '🍿', '🎂', '🥤']
  },
  {
    id: 'objects',
    label: 'Objects',
    stickers: ['🎵', '🎮', '📌', '✏️', '💡', '🔔', '🎁', '🏆', '🚀', '💎', '📷', '🔮']
  }
];

export const ALL_STICKERS = STICKER_CATEGORIES.flatMap((c) => c.stickers);
