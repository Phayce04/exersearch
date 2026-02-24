// Optimized Meal Generator with Recommended Fixes

function filterMeals(meals, options) {
  return meals.filter((meal) => {
    // Strict is_active check
    if (meal.is_active === false) return false;


    if (options.mealType) {
      const dbType = (meal.meal_type || "").toLowerCase().trim();
      const wantedType = options.mealType.toLowerCase().trim();
      if (dbType !== wantedType) return false;
    }


    if (options.calories && meal.calories > options.calories * 1.3) {
      return false;
    }

  
    if (options.budget && meal.estimated_cost > options.budget * 1.5) {
      return false;
    }

    if (options.dietTags?.length) {
      const mealTags = meal.diet_tags || [];
      const passes = options.dietTags.every((tag) => mealTags.includes(tag));
      if (!passes) return false;
    }

    return true;
  });
}

function pickMeal(meals, goal) {
  if (!meals.length) return null;

 
  if (goal === "high_protein") {
    const sorted = [...meals].sort((a, b) => (b.protein || 0) - (a.protein || 0));
   
    return sorted[Math.floor(Math.random() * Math.min(5, sorted.length))];
  }

  
  return meals[Math.floor(Math.random() * Math.min(5, meals.length))];
}

export function generateSingleMeal(meals, options) {

  if (!generateSingleMeal._logged) {
    const sample = meals[0];
    console.log("[mealGenerator] Sample meal structure:", {
      name: sample?.name,
      meal_type: sample?.meal_type,
      is_active: sample?.is_active,
      calories: sample?.calories,
      cost: sample?.estimated_cost,
      diet_tags: sample?.diet_tags,
    });
    generateSingleMeal._logged = true;
  }

  // Primary filter - strict matching
  const filtered = filterMeals(meals, options);

  console.log(
    `[mealGenerator] ${options.mealType} → ${filtered.length} / ${meals.length} passed filter`,
    {
      calLimit: Math.round((options.calories || 0) * 1.3),
      budgetLimit: Math.round((options.budget || 0) * 1.5),
      dietTags: options.dietTags || []
    }
  );

  if (filtered.length) {
    const selected = pickMeal(filtered, options.goal);
    console.log(`[mealGenerator] ✅ Selected: ${selected.name} (₱${selected.estimated_cost}, ${selected.calories} kcal)`);
    return selected;
  }


  console.warn(`[mealGenerator] ⚠️ No meals passed strict filter, trying relaxed constraints...`);
  const relaxedCalBudget = meals.filter((m) => {
    if (m.is_active === false) return false;
    

    const dbType = (m.meal_type || "").toLowerCase().trim();
    const wantedType = options.mealType.toLowerCase().trim();
    if (dbType !== wantedType) return false;


    if (options.dietTags?.length) {
      const mealTags = m.diet_tags || [];
      const passes = options.dietTags.every((tag) => mealTags.includes(tag));
      if (!passes) return false;
    }

    return true;
  });

  if (relaxedCalBudget.length) {
    console.log(`[mealGenerator] 💡 Relaxed cal/budget: ${relaxedCalBudget.length} meals found`);
    const selected = pickMeal(relaxedCalBudget, options.goal);
    console.log(`[mealGenerator] ✅ Selected: ${selected.name} (relaxed constraints)`);
    return selected;
  }


  console.warn(`[mealGenerator] ⚠️ No meals with dietary tags, trying without diet filter...`);
  const relaxedDiet = meals.filter((m) => {
    if (m.is_active === false) return false;
    
    const dbType = (m.meal_type || "").toLowerCase().trim();
    const wantedType = options.mealType.toLowerCase().trim();
    return dbType === wantedType;
  });

  if (relaxedDiet.length) {
    console.log(`[mealGenerator] 💡 Relaxed diet tags: ${relaxedDiet.length} meals found`);
    const selected = pickMeal(relaxedDiet, options.goal);
    console.log(`[mealGenerator] ⚠️ Selected: ${selected.name} (WARNING: may not match dietary requirements)`);
    return selected;
  }

  console.warn(`[mealGenerator] ⚠️ Last resort: ignoring is_active for ${options.mealType}`);
  const lastResort = meals.filter((m) => {
    const dbType = (m.meal_type || "").toLowerCase().trim();
    const wantedType = options.mealType.toLowerCase().trim();
    return dbType === wantedType;
  });

  if (lastResort.length) {
    console.log(`[mealGenerator] 🚨 Last resort: ${lastResort.length} meals (including inactive)`);
    const selected = pickMeal(lastResort, options.goal);
    console.log(`[mealGenerator] 🚨 Selected: ${selected.name} (WARNING: may be inactive or not match requirements)`);
    return selected;
  }


  console.error(`[mealGenerator] ❌ FAILED: No ${options.mealType} meals found in database at all`);
  console.error(`[mealGenerator] 📊 Database breakdown:`, {
    total: meals.length,
    breakfast: meals.filter(m => m.meal_type === 'breakfast').length,
    lunch: meals.filter(m => m.meal_type === 'lunch').length,
    dinner: meals.filter(m => m.meal_type === 'dinner').length,
    snack: meals.filter(m => m.meal_type === 'snack').length,
  });
  
  return null;
}


export function validateMealData(meals) {
  const issues = [];

  if (!Array.isArray(meals)) {
    issues.push("meals is not an array");
    return { valid: false, issues };
  }

  if (meals.length === 0) {
    issues.push("meals array is empty");
    return { valid: false, issues };
  }

 
  const byType = {
    breakfast: meals.filter(m => m.meal_type === 'breakfast').length,
    lunch: meals.filter(m => m.meal_type === 'lunch').length,
    dinner: meals.filter(m => m.meal_type === 'dinner').length,
    snack: meals.filter(m => m.meal_type === 'snack').length,
  };

  Object.entries(byType).forEach(([type, count]) => {
    if (count === 0) {
      issues.push(`No ${type} meals found`);
    } else if (count < 3) {
      issues.push(`Only ${count} ${type} meals (recommend at least 3)`);
    }
  });

  const sample = meals[0];
  const requiredFields = ['name', 'meal_type', 'calories', 'estimated_cost'];
  requiredFields.forEach(field => {
    if (!(field in sample)) {
      issues.push(`Missing required field: ${field}`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      total: meals.length,
      byType,
      active: meals.filter(m => m.is_active !== false).length,
      withDietTags: meals.filter(m => m.diet_tags?.length > 0).length,
    }
  };
}