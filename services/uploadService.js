const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Contents = require("../models/Contents");
const crypto = require("crypto");
const sharp = require("sharp");
require("dotenv").config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_KEY;

const uploadImageToS3 = async (file) => {
  let randomImageName;

  const generateRandomImageName = (bytes = 16) => {
    const newImgName = crypto.randomBytes(bytes).toString("hex");
    randomImageName = newImgName;
  };

  generateRandomImageName();

  Contents.findOne({ where: { thumbnail: randomImageName } }).then((result) => {
    if (result) {
      generateRandomImageName();
    }
  });

  const s3 = new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
  });

  const buffer = await sharp(file.buffer)
    .resize({
      width: 1920,
      height: 1080,
      fit: "contain",
    })
    .toBuffer();

  const params = {
    Bucket: bucketName,
    Key: randomImageName,
    Body: buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return randomImageName;
  } catch (err) {
    throw new Error("Görsel yüklenirken bir hata oluştu.");
  }
};

module.exports = { uploadImageToS3 };
