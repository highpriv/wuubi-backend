const cron = require("node-cron");
const Content = require("../models/Contents");

//?  midnight (00:00)

cron.schedule("0 0 * * *", async () => {
  try {
    await Content.updateMany(
      {},
      { $set: { dailyViewCount: 0, uniqueDailyViewCount: [] } }
    );
    console.log("Günlük görüntülenmeler sıfırlandı.");
  } catch (err) {
    console.error("Günlük görüntülenmeler sıfırlanırken hata oluştu: ", err);
  }
});
