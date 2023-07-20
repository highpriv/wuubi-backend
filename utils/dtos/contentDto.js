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
    updatedAt,
  };
};

module.exports = contentDto;
