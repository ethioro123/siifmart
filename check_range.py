import sys
import re

def check_div_balance(filepath, start, end):
    with open(filepath, 'r') as f:
        content = f.read()
    
    tag_pattern = re.compile(r'<(div)(\s+[^>]*[^/])?>|</div>|<div(\s+[^>]*)?/>', re.IGNORECASE | re.DOTALL)
    
    line_starts = [0]
    for m in re.finditer(r'\n', content):
        line_starts.append(m.end())
        
    def get_line_num(pos):
        import bisect
        return bisect.bisect_right(line_starts, pos)

    stack = []
    
    for m in tag_pattern.finditer(content):
        tag_text = m.group(0)
        tag_lower = tag_text.lower()
        pos = m.start()
        line_num = get_line_num(pos)
        
        if line_num < start or line_num > end:
            continue
            
        if tag_lower.startswith('<div') and not tag_lower.endswith('/>'):
            stack.append(line_num)
            print(f"Open: {line_num}")
        elif tag_lower == '</div>':
            if stack:
                popped = stack.pop()
                print(f"Close: {line_num} (matches {popped})")
            else:
                print(f"Extra Close: {line_num}")
                
    if stack:
        print(f"Net unclosed: {stack}")
    else:
        print("Balanced in range")

if __name__ == "__main__":
    check_div_balance(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
