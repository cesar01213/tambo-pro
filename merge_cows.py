import re

def parse_file(content):
    cows = {}
    current_cow = []
    current_id = None
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        id_match = re.match(r'^(?:ID:?\s*|#\s*)(\w+)', line, re.IGNORECASE)
        if id_match:
            if current_id:
                cows[current_id] = '\n'.join(current_cow)
            current_id = id_match.group(1)
            current_cow = [line]
        elif current_id:
            current_cow.append(line)
            
    if current_id:
        cows[current_id] = '\n'.join(current_cow)
    return cows

# Try reading with utf-8, fallback to latin-1
def read_content(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        with open(path, 'r', encoding='latin-1') as f:
            return f.read()

v2_content = read_content(r'c:\Users\cesar\Desktop\Nueva carpeta\Nueva carpeta\tambo-app\public\carga_verificada_v2.txt')
v3_content = read_content(r'c:\Users\cesar\Desktop\Nueva carpeta\Nueva carpeta\tambo-app\public\carga_full_v3.txt')

cows_v2 = parse_file(v2_content)
cows_v3 = parse_file(v3_content)

for cow_id, cow_data in cows_v3.items():
    cows_v2[cow_id] = cow_data

with open(r'c:\Users\cesar\Desktop\Nueva carpeta\Nueva carpeta\tambo-app\public\carga_full_v3.txt', 'w', encoding='utf-8') as f:
    def sort_key(k):
        try:
            return int(k)
        except:
            return k
            
    for cow_id in sorted(cows_v2.keys(), key=sort_key):
        f.write(cows_v2[cow_id] + '\n\n')

print(f"Merged {len(cows_v2)} cows. Updated {len(cows_v3)} records.")
