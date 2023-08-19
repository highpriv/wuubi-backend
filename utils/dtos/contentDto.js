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
    listContent,
    pollContent,
    quizContent,
    testContent,
    hashtags
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
    listContent,
    pollContent,
    quizContent,
    testContent,
    hashtags
  };
};

module.exports = contentDto;
