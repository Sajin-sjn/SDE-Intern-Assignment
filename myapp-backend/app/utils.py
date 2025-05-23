def merge_intervals(intervals, gap_tolerance=1.0):
    if not intervals:
        return []
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = []
    current = sorted_intervals[0]
    
    for interval in sorted_intervals[1:]:
        if interval[0] <= current[1] + gap_tolerance:
            current[1] = max(current[1], interval[1])
        else:
            merged.append(current)
            current = interval
    merged.append(current)
    return merged

def calculate_unique_duration(intervals, gap_tolerance=1.0):
    merged = merge_intervals(intervals, gap_tolerance)
    return sum(end - start for start, end in merged)