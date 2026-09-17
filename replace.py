import sys

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
in_func = False
for line in lines:
    if line.startswith('function handleLogout() {'):
        in_func = True
        out.append('function handleLogout() {\n')
        out.append('    if (confirm("確定要登出嗎？")) {\n')
        out.append('        const btn = document.querySelector(\'[onclick="handleLogout()"]\');\n')
        out.append('        if (btn) {\n')
        out.append('            btn.innerHTML = \'<i class="fa-solid fa-spinner fa-spin"></i> 正在同步並登出...\';\n')
        out.append('            btn.style.pointerEvents = "none";\n')
        out.append('            btn.style.opacity = "0.7";\n')
        out.append('        }\n')
        out.append('        const forceReload = () => {\n')
        out.append('            const syncableKeys = ["fitness_profile", "fitness_logs", "fitness_daily", "fitness_routines", "customFoods", "favoriteFoodIds", "fitness_theme", "last_updated"];\n')
        out.append('            syncableKeys.forEach(k => localStorage.removeItem(k));\n')
        out.append('            window.location.reload();\n')
        out.append('        };\n')
        out.append('        const failsafeTimer = setTimeout(forceReload, 1500);\n')
        out.append('        saveToFirestore().finally(() => {\n')
        out.append('            auth.signOut().finally(() => {\n')
        out.append('                clearTimeout(failsafeTimer);\n')
        out.append('                forceReload();\n')
        out.append('            });\n')
        out.append('        });\n')
        out.append('    }\n')
        out.append('}\n')
        continue
    
    if in_func:
        if line.startswith('let unsubscribeFirestore = null;'):
            in_func = False
            out.append(line)
        continue
        
    out.append(line)

with open('app.js', 'w', encoding='utf-8', newline='') as f:
    f.writelines(out)
