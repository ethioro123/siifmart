import sys
import re

def find_unclosed(filepath, start_line, end_line):
    with open(filepath, 'r') as f:
        file_content = f.read()
    
    # Improved tag parser that handles self-closing tags and different spacings
    # Match <div... or </div> or <div.../>
    # Group 1: Opening div (excluding self-closing)
    # Group 4: Closing div
    # Group 5: Self-closing div
    tag_pattern = re.compile(r'<(div(\s+[^>]*[^/])?)>|(</div>)|<(div(\s+[^>]*)?/>)', re.IGNORECASE)
    
    line_starts = [0]
    for m in re.finditer(r'\n', file_content):
        line_starts.append(m.end())
        
    def get_line_num(pos):
        import bisect
        return bisect.bisect_right(line_starts, pos)

    stack = []
    
    # Process the whole file to keep track of stack, but only report errors in range
    for m in tag_pattern.finditer(file_content):
        pos = m.start()
        line_num = get_line_num(pos)
        
        if m.group(1): # Open div (non-self-closing)
            stack.append(line_num)
        elif m.group(4): # Close div
            if stack:
                stack.pop()
            else:
                if line_num >= start_line and line_num <= end_line:
                    print(f"Extra closing div at line {line_num}")
        elif m.group(5): # Self-closing div
            pass # Does not change stack
    
    for line_num in stack:
        if line_num >= start_line and line_num <= end_line:
            print(f"Unclosed div opened at line {line_num}")

if __name__ == "__main__":
    find_unclosed(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
