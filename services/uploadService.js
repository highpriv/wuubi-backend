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
  try {
    let randomImageName;

    const generateRandomImageName = (bytes = 16, file) => {
      const fileExtension = file.originalname.split(".").pop();
      const newImgName = crypto.randomBytes(bytes).toString("hex");
      randomImageName = newImgName + "." + fileExtension;
    };

    generateRandomImageName(16, file);

    try {
      const result = await Contents.findOne({
        where: { thumbnail: randomImageName },
      });
      if (result) {
        generateRandomImageName(16, file);
      }
    } catch (err) {
      throw new Error("Görsel kaydedilirken hata oluştu.");
    }

    const s3 = new S3Client({
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
      },
      region: bucketRegion,
    });

    const buffer = await sharp(file.buffer)
      .resize({
        width: 1350,
        height: 415,
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
  } catch (err) {
    throw new Error("Görsel yüklenirken bir hata oluştu.");
  }
};

module.exports = { uploadImageToS3 };
