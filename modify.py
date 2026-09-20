import sys

def replace_in_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add to syncableKeys and keys arrays
    # There are arrays like: ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods'...]
    content = content.replace(
        "'fitness_routines', 'customFoods'",
        "'fitness_routines', 'fitness_templates', 'fitness_routine_plan', 'customFoods'"
    )

    # 2. Add to dataToSave (around line 193)
    target_save = "fitness_routines: JSON.stringify(typeof WORKOUT_ROUTINES !== 'undefined' ? WORKOUT_ROUTINES : {}) || '{}',"
    new_save = target_save + "\n        fitness_templates: JSON.stringify(typeof FITNESS_TEMPLATES !== 'undefined' ? FITNESS_TEMPLATES : []) || '[]',\n        fitness_routine_plan: JSON.stringify(typeof fitnessRoutinePlan !== 'undefined' ? fitnessRoutinePlan : {}) || '{}',"
    content = content.replace(target_save, new_save)

    # 3. Add to load (around line 345)
    target_load = "WORKOUT_ROUTINES = (data.fitness_routines ? JSON.parse(data.fitness_routines) : null) || (typeof defaultRoutines !== 'undefined' ? defaultRoutines : {});"
    new_load = target_load + "\n                window.FITNESS_TEMPLATES = (data.fitness_templates ? JSON.parse(data.fitness_templates) : null) || [];\n                fitnessRoutinePlan = (data.fitness_routine_plan ? JSON.parse(data.fitness_routine_plan) : null) || { mode: 'none' };"
    content = content.replace(target_load, new_load)

    # 4. Add initializations (around line 389)
    target_init = "let WORKOUT_ROUTINES = JSON.parse(localStorage.getItem('fitness_routines')) || defaultRoutines;"
    new_init = target_init + "\nlet fitnessRoutinePlan = JSON.parse(localStorage.getItem('fitness_routine_plan')) || { mode: 'none' };"
    content = content.replace(target_init, new_init)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print("Success")

if __name__ == "__main__":
    replace_in_file("c:/Users/windl/OneDrive/桌面/AI-fitness/app.js")