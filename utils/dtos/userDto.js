const userDto = (contentParam) => {
    const {
      _id,
      name,
      lastname,
      username,
      email,
      achievement,
      userFollowers,
      following,
      bio,
      profilePhoto,
      coverPhoto,
      joinedGroups,
      registered,
      createdContents,
      publications,
    } = contentParam;
    return {
        _id,
        name,
        lastname,
        username,
        email,
        joinedGroups,
        registered,
        achievement,
        userFollowers,
        following,
        bio,
        profilePhoto,
        coverPhoto,
        createdContents,
        publications
    };
  };
  
  module.exports = userDto;
  