
/*
data = ['#',1,0,0,1,1,'#']

# data, state
rules = {
    (1, 0):   (1, 0, 1),
    (0, 0):   (0, 0, 1),
    ('#', 0): ('#', 1, -1),
    (1, 1):   (0, 1, -1),
    (0, 1):   (1, 2),
    ('#', 1): (1, 2),
}


def turing(data, rules, pos = 1, state = 0):
    cur = (data[pos], state)
    if cur in rules:
        res = rules[cur]
        offset = 0
        if len(res)>2:
            offset = res[2]

        data[pos] = res[0]
        turing(data, rules, pos+offset, res[1])
    return data
        


print(turing(data, rules, 1, 0))
*/