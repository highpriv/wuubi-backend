const contentDto = (contentParam) => {
  const {
    _id,
    viewCount,
    title,
    type,
    slug,
    category,
    content,
    summary,
    thumbnail,
    userID,
    status,
    createdAt,
    likedBy,
    savedBy,
    updatedAt,
  } = contentParam;
  return {
    _id,
    viewCount,
    title,
    type,
    slug,
    category,
    content,
    summary,
    thumbnail,
    userID,
    status,
    createdAt,
    likedBy,
    savedBy,
    updatedAt,
  };
};

module.exports = contentDto;
