const userDto = (contentParam) => {
    const {
      _id,
      name,
      lastname,
      username,
      email,
      joinedGroups,
      registered,
    } = contentParam;
    return {
        _id,
        name,
        lastname,
        username,
        email,
        joinedGroups,
        registered,
    };
  };
  
  module.exports = userDto;
  