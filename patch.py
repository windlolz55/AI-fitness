import sys

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace manual sync To GitHub
old_str = """        'fitness_theme': localStorage.getItem('fitness_theme') || 'light'
    };
    
    const gistData = {
        description: "AI Fitness App Backup","""

new_str = """        'fitness_theme': localStorage.getItem('fitness_theme') || 'light',
        'last_updated': new Date().toISOString()
    };
    
    const gistData = {
        description: "AI Fitness App Backup","""

content = content.replace(old_str, new_str)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully!")
