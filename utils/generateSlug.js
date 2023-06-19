const slugify = require("slugify");

const generateSlug = (text) => {
  const slug = slugify(text, {
    replacement: "-",
    remove: /[*+~.()'"!:@?,;^+%&=_]/g,
    lower: true,
  });

  return slug;
};

module.exports = generateSlug;
