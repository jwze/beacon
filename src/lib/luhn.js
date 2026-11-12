/**
 * Luhn 算法与卡号枚举
 *
 * 纯函数模块，不依赖 DOM，可单独测试。
 * 模式语法：
 *   0-9     固定位
 *   * / x   任意数字
 *   a-z     同一字母绑定同一数字（分组约束）
 */

/** Luhn 校验：末位为校验位 */
export function luhnCheck(cardNumber) {
  const digits = cardNumber.split('').map((d) => parseInt(d, 10));
  let checksum = 0;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    const digit = digits[i];
    const position = digits.length - 1 - i;

    if (position % 2 === 1) {
      let doubled = digit * 2;
      if (doubled > 9) doubled -= 9;
      checksum += doubled;
    } else {
      checksum += digit;
    }
  }

  return checksum % 10 === 0;
}

/**
 * 枚举模式对应的所有合法卡号
 * @param {string} rawPattern 例如 622848aaabbb
 * @returns {string[]}
 */
export function generateCardNumbers(rawPattern) {
  const pattern = rawPattern.toLowerCase();
  const length = pattern.length;

  const fixedPositions = {};
  const variableGroups = {};
  const wildcards = [];

  for (let i = 0; i < length; i += 1) {
    const char = pattern[i];
    if (char >= '0' && char <= '9') {
      fixedPositions[i] = parseInt(char, 10);
    } else if (char === '*' || char === 'x') {
      wildcards.push(i);
    } else if (char >= 'a' && char <= 'z') {
      if (!variableGroups[char]) variableGroups[char] = [];
      variableGroups[char].push(i);
    } else {
      throw new Error(`无效字符: ${char}`);
    }
  }

  const results = [];

  /** 用固定位 + 分组取值 + 通配位取值拼出卡号，通过校验则收集 */
  const collect = (wildcardValues, groupAssignments) => {
    const digits = new Array(length);

    Object.entries(fixedPositions).forEach(([position, digit]) => {
      digits[position] = digit.toString();
    });
    Object.entries(groupAssignments).forEach(([group, value]) => {
      variableGroups[group].forEach((position) => {
        digits[position] = value.toString();
      });
    });
    wildcards.forEach((position, index) => {
      digits[position] = wildcardValues[index];
    });

    const cardNumber = digits.join('');
    if (luhnCheck(cardNumber)) results.push(cardNumber);
  };

  const fillWildcards = (index, values, groupAssignments) => {
    if (index === wildcards.length) {
      collect(values, groupAssignments);
      return;
    }
    for (let digit = 0; digit < 10; digit += 1) {
      values.push(digit.toString());
      fillWildcards(index + 1, values, groupAssignments);
      values.pop();
    }
  };

  const assignGroups = (groupList, assignments) => {
    if (groupList.length === 0) {
      if (wildcards.length > 0) {
        fillWildcards(0, [], assignments);
      } else {
        collect([], assignments);
      }
      return;
    }

    const [group, ...rest] = groupList;
    for (let digit = 0; digit < 10; digit += 1) {
      assignments[group] = digit;
      assignGroups(rest, assignments);
      delete assignments[group];
    }
  };

  const groupKeys = Object.keys(variableGroups);
  if (groupKeys.length > 0) {
    assignGroups(groupKeys, {});
  } else if (wildcards.length > 0) {
    fillWildcards(0, [], {});
  } else {
    collect([], {});
  }

  return results;
}
