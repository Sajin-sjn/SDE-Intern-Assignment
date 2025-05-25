def merge_intervals(intervals):
    if not intervals:
        return []
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = []
    current_interval = list(sorted_intervals[0])
    
    for interval in sorted_intervals[1:]:
        if interval[0] <= current_interval[1]:
            current_interval[1] = max(current_interval[1], interval[1])
        else:
            merged.append(current_interval)
            current_interval = list(interval)
    
    merged.append(current_interval)
    return merged

def calculate_unique_duration(intervals):
    merged = merge_intervals(intervals)
    return sum(interval[1] - interval[0] for interval in merged)