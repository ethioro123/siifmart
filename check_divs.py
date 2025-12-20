import sys
import re

def check_div_balance(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    tag_pattern = re.compile(r'(<div[^>]*>)', re.IGNORECASE | re.DOTALL)
    close_pattern = re.compile(r'</div\s*>', re.IGNORECASE)
    
    tags = []
    for m in tag_pattern.finditer(content):
        tags.append(('open', m.start(), m.group(1)))
    for m in close_pattern.finditer(content):
        tags.append(('close', m.start(), m.group(0)))
        
    tags.sort(key=lambda x: x[1])
    
    line_starts = [0]
    for m in re.finditer(r'\n', content):
        line_starts.append(m.end())
        
    def get_line_num(pos):
        import bisect
        return bisect.bisect_right(line_starts, pos)

    stack = []
    
    for type, pos, text in tags:
        line_num = get_line_num(pos)
        if type == 'open':
            # Check for self-closing
            is_self = text.rstrip().endswith('/>')
            # DEBUG
            if line_num == 1111:
                print(f"DEBUG: 1111 text ends with: {text[-10:]!r}")
                print(f"DEBUG: 1111 rstrip ends with: {text.rstrip()[-10:]!r}")
                print(f"DEBUG: 1111 is_self: {is_self}")
                
            if is_self:
                pass
            else:
                stack.append(line_num)
        else:
            if stack:
                stack.pop()
                
    if stack:
        print(f"Net unclosed: {len(stack)}")
        print(f"Unclosed lines: {stack}")
    else:
        print("Balanced")

if __name__ == "__main__":
    check_div_balance(sys.argv[1])
