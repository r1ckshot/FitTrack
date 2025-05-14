const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileData: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    weight: Number,
    height: Number
  }
}, { timestamps: true }); // Automatyczne pola createdAt i updatedAt

// Hook pre-findOneAndDelete
UserSchema.pre('findOneAndDelete', async function(next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (!user) {
      return next();
    }

    const userId = user._id;
    
    // Importujemy modele i usuwamy związane dane
    const Analysis = mongoose.model('Analysis');
    const Progress = mongoose.model('Progress');
    const DietPlan = mongoose.model('DietPlan');
    const TrainingPlan = mongoose.model('TrainingPlan');
    
    // Usuwanie wszystkich powiązanych danych
    await Promise.all([
      Analysis.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      DietPlan.deleteMany({ userId }),
      TrainingPlan.deleteMany({ userId })
    ]);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Hook dla deleteOne
UserSchema.pre('deleteOne', { document: false, query: true }, async function(next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (!user) {
      return next();
    }

    const userId = user._id;
    
    // Importujemy modele i usuwamy związane dane
    const Analysis = mongoose.model('Analysis');
    const Progress = mongoose.model('Progress');
    const DietPlan = mongoose.model('DietPlan');
    const TrainingPlan = mongoose.model('TrainingPlan');
    
    // Usuwanie wszystkich powiązanych danych
    await Promise.all([
      Analysis.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      DietPlan.deleteMany({ userId }),
      TrainingPlan.deleteMany({ userId })
    ]);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Hook dla deleteMany
UserSchema.pre('deleteMany', async function(next) {
  try {
    const users = await this.model.find(this.getFilter());
    if (!users || users.length === 0) {
      return next();
    }

    const userIds = users.map(user => user._id);
    
    // Importujemy modele i usuwamy związane dane
    const Analysis = mongoose.model('Analysis');
    const Progress = mongoose.model('Progress');
    const DietPlan = mongoose.model('DietPlan');
    const TrainingPlan = mongoose.model('TrainingPlan');
    
    // Usuwanie wszystkich powiązanych danych dla wszystkich znalezionych użytkowników
    await Promise.all([
      Analysis.deleteMany({ userId: { $in: userIds } }),
      Progress.deleteMany({ userId: { $in: userIds } }),
      DietPlan.deleteMany({ userId: { $in: userIds } }),
      TrainingPlan.deleteMany({ userId: { $in: userIds } })
    ]);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Eksportujemy model utworzony na podstawie schematu
module.exports = mongoose.model('User', UserSchema);