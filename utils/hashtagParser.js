const parseHashtags = (str) => {
  const regexp = /#[\w]+/g;
  const matches = str.match(regexp);
  if (matches) {
    const tags = matches.map((match) => match.slice(1));
    let uniqueTags = [];
    tags.forEach((tag) => {
        if (!uniqueTags.includes(tag)) {
            uniqueTags.push(tag);
            }
        });
    return uniqueTags;
  } else {
    return [];
  }
};

module.exports = parseHashtags;
