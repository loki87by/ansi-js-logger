/**
 * ЛОГГЕР С ANSI-ФОРМАТИРОВАНИЕМ
 *
 * Этот модуль предоставляет расширенную систему логирования с поддержкой
 * ANSI escape sequences для цветного и стилизованного вывода в консоль.
 * Поддерживает цвета, стили текста, верхние/нижние индексы и комбинирование стилей.
 */

// =============================================================================
// БАЗОВЫЕ КОНСТАНТЫ ANSI ESCAPE SEQUENCES
// =============================================================================

/**
 * Префикс ANSI escape sequence
 * @constant {string}
 */
const prefix = "\x1b[";

/**
 * Постфикс ANSI escape sequence
 * @constant {string}
 */
const postfix = "m";

/**
 * Код сброса всех стилей и цветов
 * @constant {string}
 */
const reset = `${prefix}0${postfix}`;

// =============================================================================
// ТАБЛИЦЫ СТИЛЕЙ И ЦВЕТОВ
// =============================================================================

/**
 * Словарь стилей текста с кодами включения/выключения
 * @constant {Object}
 * @property {Object} bold - Жирный текст (on: 1, off: 22)
 * @property {Object} dim - Тусклый текст (on: 2, off: 22)
 * @property {Object} italic - Курсив (on: 3, off: 23)
 * @property {Object} cursive - Курсив (алиас для italic) (on: 3, off: 23)
 * @property {Object} underline - Подчеркивание (on: 4, off: 24)
 * @property {Object} blink - Мигание (on: 5, off: 25)
 * @property {Object} inverse - Инверсные цвета (on: 7, off: 27)
 * @property {Object} hidden - Скрытый текст (on: 8, off: 28)
 * @property {Object} strikethrough - Зачеркивание (on: 9, off: 29)
 */
const STYLES = {
  bold: { on: 1, off: 22 },
  dim: { on: 2, off: 22 },
  italic: { on: 3, off: 23 },
  cursive: { on: 3, off: 23 },
  underline: { on: 4, off: 24 },
  blink: { on: 5, off: 25 },
  inverse: { on: 7, off: 27 },
  hidden: { on: 8, off: 28 },
  strikethrough: { on: 9, off: 29 },
};

/**
 * Базовые цвета текста (коды 30-37)
 * @constant {Object}
 * @property {number} black - Черный (30)
 * @property {number} red - Красный (31)
 * @property {number} green - Зеленый (32)
 * @property {number} yellow - Желтый (33)
 * @property {number} blue - Синий (34)
 * @property {number} magenta - Пурпурный (35)
 * @property {number} cyan - Голубой (36)
 * @property {number} white - Белый (37)
 * @property {number} reset - Сброс цвета (0)
 */
const COLORS = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  reset: 0,
};

/**
 * Коды для верхних/нижних индексов
 * @constant {Object}
 * @property {number} down - Нижний индекс (subscript) (73)
 * @property {number} up - Верхний индекс (superscript) (74)
 * @property {number} off - Отключение индексов (75)
 */
const INDEX = { down: 73, up: 74, off: 75 };

// =============================================================================
// ОСНОВНЫЕ ФУНКЦИИ ФОРМАТИРОВАНИЯ
// =============================================================================

/**
 * Генерирует ANSI код для указанного цвета
 * @param {string} text - Название цвета или пустая строка для RGB
 * @param {Object} [options=null] - Дополнительные опции
 * @param {boolean} [options.bg=false] - true для цвета фона
 * @param {boolean} [options.contrast=false] - true для яркой версии цвета
 * @param {Array} [options.rgb=null] - Массив [R, G, B] для RGB цвета
 * @returns {string} ANSI escape sequence или пустая строка если цвет не найден
 *
 * @example
 * getColor('red') // returns '\x1b[31m'
 * getColor('', {rgb: [255, 0, 0]}) // returns '\x1b[38;2;255;0;0m'
 * getColor('red', {bg: true}) // returns '\x1b[41m'
 */
function getColor(text = "", options = null) {
  const bg = options?.bg || false;
  const contrast = options?.contrast;
  const rgb = options?.rgb;

  // Для именованных цветов требуется минимум 3 символа
  if (!rgb && text.length < 3) return "";

  let keyShifting = 0;

  // Сдвиг для цвета фона (+10 к базовому коду)
  if (bg) keyShifting += 10;

  // Сдвиг для ярких цветов (+60 к базовому коду)
  if (contrast && !rgb) keyShifting += 60;

  // Обработка RGB цветов
  if (rgb) {
    const colors = parseRGB(rgb);
    const args =
      colors.length === 1
        ? [38 + keyShifting, 5, colors[0]]
        : colors.length === 2
        ? [38 + keyShifting, 2, ...colors, 0]
        : [38 + keyShifting, 2, ...colors.slice(0, 3)];
    return `${prefix}${args.join(";")}${postfix}`;
  }

  // Поиск именованного цвета
  let key = Object.keys(COLORS).find((i) => i === text.toLowerCase());

  if (!key) {
    key = Object.keys(COLORS).find((i) => text.toLowerCase().includes(i));
  }

  if (!key) return "";

  const color = COLORS[key] + keyShifting;
  return `${prefix}${color}${postfix}`;
}

/**
 * Применяет верхние/нижние индексы к тексту
 * @param {string} text - Текст для преобразования
 * @param {string|number} reg - Тип индекса: 'up', 'subscript', 'sub', 'over', 'top', 'upper', число >0 (верхний индекс); 'down', 'superscript', 'super', 'sup', 'under', 'bottom', 'lower' число <0 (нижний индекс)
 * @param {Array} styles - Массив дополнительных стилей (ANSI кодов)
 * @returns {string} Отформатированный текст с индексами
 *
 * @example
 * halving('2', 'up') // Верхний индекс
 * halving('2', 'down', [32]) // Нижний индекс с зеленым цветом
 */
function halving(text, reg, styles) {
  if (!reg) return text;

  // Определение направления индекса
  const down =
    [
      "down",
      "superscript",
      "super",
      "sup",
      "under",
      "bottom",
      "lower",
    ].includes(`${reg}`.toLowerCase()) ||
    (!isNaN(+reg) && reg < 0);
  const up =
    ["up", "subscript", "sub", "over", "top", "upper"].includes(
      `${reg}`.toLowerCase()
    ) ||
    (!isNaN(+reg) && reg > 0);
  const key = down ? "down" : up ? "up" : null;

  if (!key) return text;

  // Очистка и нормализация стилей
  const styleCodes = styles
    .filter((style) => style && style !== "")
    .map((style) => (typeof style === "string" ? parseInt(style, 10) : style))
    .filter((style) => !isNaN(style));

  const startCodes = [INDEX[key], ...styleCodes];
  const endCodes = [INDEX.off, ...styleCodes];

  return `${prefix}${startCodes.join(
    ";"
  )}${postfix}${text}${prefix}${endCodes.join(";")}${postfix}`;
}

/**
 * Парсит RGB значения из различных строковых форматов
 * @param {string|Array} input - Входные данные (строка или массив)
 * @returns {Array|null} Массив [R, G, B] или null при ошибке
 *
 * @example
 * parseRGB('255,0,0') // returns [255, 0, 0]
 * parseRGB('255-0-0') // returns [255, 0, 0]
 * parseRGB('255.0.0') // returns [255, 0, 0]
 * parseRGB('255 0 0') // returns [255, 0, 0]
 * parseRGB('255/0-0') // returns [255, 0, 0]
 */
function parseRGB(input) {
  if (!input) return null;
  // Нормализация входных данных
  if (Array.isArray(input)) {
    return input.slice(0, 3).map((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num % 256;
    });
  }

  const inputStr = String(input);
  const rgbRegex = /\d*/gi;
  const match = inputStr.match(rgbRegex);

  if (!match) {
    return null;
  }

  // Извлечение и валидация чисел
  return match
    .filter((i) => i.length)
    .slice(0, 3)
    .map((i) => parseInt(i, 10))
    .map((i) => (isNaN(i) ? 0 : i % 256));
}

/**
 * Конвертирует HEX цвет в RGB
 * @param {string} hex - HEX цвет в формате #RGB, #RRGGBB или #RRGGBBAA
 * @returns {Array|null} Массив [R, G, B] или null при ошибке
 *
 * @example
 * hexToRgb('#fff') // returns [255, 255, 255]
 * hexToRgb('#ffffff') // returns [255, 255, 255]
 * hexToRgb('#ff0000') // returns [255, 0, 0]
 */
function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");

  let r, g, b;

  // Обработка разных форматов HEX
  if (hex.length === 3) {
    // #RGB → #RRGGBB
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    // #RRGGBB
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (hex.length === 8) {
    // #RRGGBBAA (альфа-канал игнорируется)
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return null;
  }

  return [r, g, b];
}

/**
 * Определяет тип цветового кода и парсит его
 * @param {string} code - Цветовой код (имя, HEX, RGB)
 * @returns {Object} Объект с распарсенными данными {textCode, options}
 *
 * @example
 * getColorFromText('red') // returns {textCode: 'red', options: {rgb: null}}
 * getColorFromText('#ff0000') // returns {textCode: '', options: {rgb: [255, 0, 0]}}
 * getColorFromText('255-0-0') // returns {textCode: '', options: {rgb: [255, 0, 0]}}
 */
function getColorFromText(code) {
  // Определение типа цвета
  const hex = code.startsWith("#");
  const rgb =
    code.toLowerCase().includes("rgb") ||
    code.toLowerCase().includes(".") ||
    code.toLowerCase().includes(",") ||
    code.toLowerCase().includes("-") ||
    code.toLowerCase().includes("/") ||
    code.toLowerCase().includes("\\") ||
    !isNaN(+code);

  const textCode = hex || rgb ? "" : code;
  const rgbArray = hex ? hexToRgb(code) : rgb ? parseRGB(code) : [];

  const options = {
    rgb: rgbArray.length ? rgbArray : null,
  };

  return { textCode, options };
}

/**
 * Простое окрашивание текста одним цветом
 * @param {string} text - Текст для окрашивания
 * @param {string} code - Цветовой код (имя, HEX, RGB)
 * @returns {string} Окрашенный текст с ANSI кодами
 *
 * @example
 * colorizeByText('Ошибка', 'red') // Красный текст
 * colorizeByText('Текст', '#ff0000') // HEX цвет
 * colorizeByText('Текст', '255-0-0') // RGB цвет
 */
function colorizeByText(text, code) {
  if (!code || !`${code}`.length) return text;

  const { textCode, options } = getColorFromText(code);
  const colorCode = getColor(textCode, options.rgb !== null ? options : null);
  return `${colorCode}${text}${reset}`;
}

// =============================================================================
// ФУНКЦИИ СТРОКОВОГО ФОРМАТИРОВАНИЯ
// =============================================================================

/**
 * Парсит строку с форматированием через разделители
 * @param {string} text - Текст с командами форматирования
 * @param {Object} [separators=null] - Кастомные разделители
 * @param {string|null} [separators.command='|'] - Разделитель команд
 * @param {string|null} [separators.param='.'] - Разделитель параметров
 * @returns {string} Отформатированный текст
 *
 * @example
 * // Синтаксис: |команда.параметр1.параметр2.текст|
 * parseString('|c.red.Красный текст|') // Цвет
 * parseString('-c/red/Красный текст-', {command: '-', param: '/'}) // Цвет
 * parseString('|s.bold.Жирный текст|') // Стиль
 * parseString('|i.up.Надстрочный текст|') // Индекс
 * parseString('|c.bg_red.Текст на красном фоне|') // Фон
 * parseString('|c.green+.Ярко-зеленый текст|') // Яркий цвет
 */
function parseString(text, separators = { command: null, param: null }) {
  let str = "";
  let lastColor = null;

  // Настройка разделителей
  let commandSeparator = "|";
  let paramSeparator = ".";

  if (separators && separators.command) commandSeparator = separators.command;
  if (separators && separators.param) paramSeparator = separators.param;

  // Разбивка на команды
  const dataArray = text.split(commandSeparator);

  // Обработка каждой команды
  dataArray
    .filter((i) => i.length)
    .forEach((i) => {
      const params = i.split(paramSeparator);
      const key = params[0].replace(commandSeparator, "").toLowerCase()[0];
      const currentText = params.slice(2).join("");

      // Обработка индексов (i)
      if (key === "i") {
        str += halving(
          currentText,
          params[1],
          [lastColor].filter((i) => i !== null)
        );
      }

      // Обработка стилей (s)
      if (key === "s") {
        const style = STYLES[params[1]];
        let on = "",
          off = "";
        if (style) {
          on = `${prefix}${[style.on, lastColor]
            .filter((i) => i !== null)
            .join(";")}${postfix}`;
          off = `${prefix}${[style.off, lastColor]
            .filter((i) => i !== null)
            .join(";")}${postfix}`;
        }
        str += on + currentText + off;
      }

      // Обработка цветов (c)
      if (key === "c") {
        const isBackground = params[1].toLowerCase().startsWith("bg_");
        const isNeedContrast = params[1].toLowerCase().endsWith("+");
        const cleanedCode = params[1].toLowerCase().replace(/(bg_|\+)/gi, "");

        const { textCode, options } = getColorFromText(cleanedCode);
        options.contrast = isNeedContrast;
        options.bg = isBackground;

        const color = getColor(textCode, options);
        str += color;
        lastColor = color.replace(prefix, "").replace(/m$/, "");
        str += currentText;
      }
    });

  str += reset;
  return str;
}

// =============================================================================
// ФУНКЦИИ ОБЪЕКТНОГО ФОРМАТИРОВАНИЯ
// =============================================================================

/**
 * Подготавливает объект с настройками стилей для форматирования
 * @param {Object} data - Объект с настройками стилей
 * @param {string|Object} [data.color] - Цвет текста
 * @param {string|Object} [data.background] - Цвет фона
 * @param {string|Array} [data.style] - Стиль текста
 * @returns {Object} Объект с ANSI кодами {args, ends}
 *
 * @example
 * prepareObject({color: 'red', style: 'bold'})
 * prepareObject({background: 'white', style: ['italic', 'underline']})
 */
function prepareObject(data) {
  /**
   * Вспомогательная функция для извлечения цветового кода
   * @param {string|Array|Object} colorData - Данные цвета
   * @returns {Object} Объект {textCode, options}
   */
  const getColorCode = (colorData) => {
    const colorValue =
      typeof colorData === "string"
        ? colorData
        : Array.isArray(colorData)
        ? colorData.find((i) => typeof i !== "boolean")
        : typeof colorData === "object"
        ? colorData.data || colorData.text || colorData.content
        : null;

    const { textCode, options } = getColorFromText(colorValue);
    options.contrast = Array.isArray(colorData)
      ? colorData.find((i) => typeof i === "boolean")
      : typeof colorData === "object"
      ? colorData.contrast
      : false;

    return { textCode, options };
  };

  const args = []; // Коды включения стилей
  const ends = []; // Коды выключения стилей

  // Обработка цвета текста
  if (data.hasOwnProperty("color")) {
    const colorData = data["color"];
    const { textCode, options } = getColorCode(colorData);
    const colorCode = getColor(textCode, options);

    if (colorCode) {
      const cleanCode = colorCode.replace(prefix, "").replace(/m$/, "");
      args.push(cleanCode);
    }
  }

  // Обработка цвета фона
  if (data.hasOwnProperty("background")) {
    const colorData = data["background"];
    const { textCode, options } = getColorCode(colorData);
    options.bg = true;
    const colorCode = getColor(textCode, options);

    if (colorCode) {
      const cleanCode = colorCode.replace(prefix, "").replace(/m$/, "");
      args.push(cleanCode);
    }
  }

  // Обработка стилей текста
  if (data.hasOwnProperty("style")) {
    const styles = Array.isArray(data["style"])
      ? data["style"]
      : [data["style"]];
    styles.forEach((i) => {
      // Добавление кодов включения и выключения стиля
      args.push(STYLES[i].on);
      ends.push(STYLES[i].off);
    });
  }

  return { args, ends };
}

/**
 * Основная функция для сложного форматирования текста
 * @param {string} text - Текст для форматирования
 * @param {Object} [options=null] - Опции форматирования
 * @param {Object} [options.all] - Глобальные стили для всего текста
 * @param {Array|Object} [options.currents] - Стили для конкретных подстрок
 * @param {Array|Object} [options.notes] - Модификация отдельных символов
 * @param {Object} [options.separators] - Кастомные разделители для parseString
 * @returns {string} Отформатированный текст с ANSI кодами
 *
 * @example
 * // Простое окрашивание
 * prepareCustomLog('Текст', {all: {color: 'green'}})
 *
 * // Выделение подстрок
 * prepareCustomLog('Текст с выделением', {
 *   all: {color: 'black'},
 *   currents: [
 *     {target: 'выделением', color: 'red', style: 'bold'}
 *   ]
 * })
 *
 * // Модификация символов (индексы)
 * prepareCustomLog('H2O', {
 *   notes: [
 *     {target: 'H2O', index: 1, reg: 'down'}
 *   ]
 * })
 *
 * // Комплексное форматирование
 * prepareCustomLog('Важное сообщение', {
 *   all: {color: 'yellow', style: 'bold'},
 *   currents: [
 *     {target: 'Важное', color: 'red', style: 'underline'}
 *   ],
 *   notes: [
 *     {target: 'сообщение', index: [0, 1], reg: 'up'}
 *   ]
 * })
 */
function prepareCustomLog(text = "", options = null) {
  let str = ""; // Итоговый отформатированный текст
  let global = ""; // Глобальные стили
  let globalArgs = []; // Аргументы глобальных стилей
  const changedTargets = []; // Список измененных подстрок
  const targetChanges = []; // Стили примененные к подстрокам

  // Если текст содержит команды форматирования - используем parseString
  if (
    (options?.separators &&
      options?.separators?.command &&
      text.includes(options?.separators?.command)) ||
    text.includes("|")
  ) {
    return parseString(text, options?.separators);
  }

  // Применение глобальных стилей ко всему тексту
  if (options?.all) {
    const { args } = prepareObject(options.all);
    globalArgs = args;
    global += `${prefix}${args.join(";")}${postfix}`;
    str += global;
  }

  let textContent = text;

  // Обработка стилей для конкретных подстрок (currents)
  if (options?.currents) {
    const currents = Array.isArray(options.currents)
      ? options.currents
      : [options.currents];

    currents.forEach((current) => {
      const { target } = current;

      if (target) {
        const { args, ends } = prepareObject(current);

        // Определение кода сброса после подстроки
        const end =
          current.hasOwnProperty("color") ||
          current.hasOwnProperty("background")
            ? `${reset}${global}`
            : `${prefix}${ends.join(";")}${postfix}${global}`;

        // Замена подстроки на форматированную версию
        textContent = textContent.replaceAll(
          target,
          `${prefix}${[args, ...globalArgs].join(";")}${postfix}${target}${end}`
        );

        // Сохранение информации об измененных подстроках
        changedTargets.push(target);
        targetChanges.push(args);
      }
    });
  }

  // Обработка модификации отдельных символов (notes)
  if (options?.notes) {
    const notes = Array.isArray(options.notes)
      ? options.notes
      : [options.notes];

    notes.forEach((note) => {
      const { target, index, reg } = note;

      if (target) {
        // Поиск примененных стилей для этой подстроки
        const targetUsed = changedTargets.findIndex((i) => i.includes(target));
        const styles = targetUsed >= 0 ? targetChanges[targetUsed] : [];

        // Нормализация индексов
        const indexes = Array.isArray(index) ? index : [index];

        // Модификация указанных символов в подстроке
        const current = target
          .split("")
          .map((symbol, num) => {
            if (!indexes.includes(num)) return symbol;
            return halving(symbol, reg, styles);
          })
          .join("");

        // Замена оригинальной подстроки на модифицированную
        textContent = textContent.replaceAll(target, current);
      }
    });
  }

  // Сборка итогового текста
  str += textContent;
  str += reset;
  return str;
}

// =============================================================================
// СИСТЕМА ПОДАВЛЕНИЯ ПОВТОРЯЮЩИХСЯ ЛОГОВ
// =============================================================================

// Хранилище последних логов
let lastLogs = {
  debug: { text: null, timestamp: 0 },
  info: { text: null, timestamp: 0 },
  warn: { text: null, timestamp: 0 },
  error: { text: null, timestamp: 0 },
  print: { text: null, timestamp: 0 },
  custom: { text: null, timestamp: 0 },
};

// Конфигурация подавления
const suppressionConfig = {
  enabled: false,
  timeout: 1000, // Время в ms, в течение которого логи считаются повторными
  showCounter: true, // Показывать счетчик повторений
};

/**
 * Включает/выключает подавление повторяющихся логов
 * @param {Object} config - Конфигурация
 * @param {boolean} [config.enabled=true] - Включить подавление
 * @param {number} [config.timeout=1000] - Таймаут для определения повторов (ms)
 * @param {boolean} [config.showCounter=true] - Показывать счетчик повторений
 */
export function configureLogSuppression(config = {}) {
  suppressionConfig.enabled =
    config.enabled !== undefined ? config.enabled : true;
  suppressionConfig.timeout = config.timeout || 1000;
  suppressionConfig.showCounter =
    config.showCounter !== undefined ? config.showCounter : true;

  // Сброс истории при изменении конфигурации
  if (config.resetHistory) {
    Object.keys(lastLogs).forEach((key) => {
      lastLogs[key] = { text: null, timestamp: 0 };
    });
  }
}

// Счетчики повторений
const repeatCounters = new Map();
/**
 * Проверяет, является ли лог повторением
 * @param {string} type - Тип лога (debug, info, etc.)
 * @param {string} text - Текст лога
 * @returns {Object} {isRepeat: boolean, count: number}
 */
function checkIfRepeat(type, text) {
  if (!suppressionConfig.enabled) {
    return { isRepeat: false, count: 0 };
  }

  const now = Date.now();
  const lastLog = lastLogs[type];

  // Если тот же текст и не истек таймаут
  if (
    lastLog.text === text &&
    now - lastLog.timestamp < suppressionConfig.timeout
  ) {
    const key = `${type}:${text}`;
    const count = (repeatCounters.get(key) || 0) + 1;
    repeatCounters.set(key, count);
    return { isRepeat: true, count };
  }

  // Обновляем последний лог
  lastLogs[type] = { text, timestamp: now };

  // Сбрасываем счетчик для этого типа+текста
  const key = `${type}:${text}`;
  if (repeatCounters.has(key)) {
    const oldCount = repeatCounters.get(key);
    repeatCounters.delete(key);

    // Если был предыдущий повтор, выводим счетчик
    if (oldCount > 0 && suppressionConfig.showCounter) {
      console.log(colorizeByText(`[Повторён ${oldCount} раз]`, "dim"));
    }
  }

  return { isRepeat: false, count: 0 };
}

// =============================================================================
// ПУБЛИЧНЫЙ API ЛОГГЕРА
// =============================================================================

/**
 * Объект логгера с методами для различных типов сообщений
 * @namespace LOG
 */
export const LOG = {
  /**
   * Вывод отладочного сообщения (синий цвет)
   * @param {string} text - Текст сообщения
   * @param {string} color - Цвет сообщения
   * @param {boolean} [force=false] - Принудительный вывод, игнорируя подавление
   */
  debug: (text, color = "blue", force = false) => {
    if (typeof color === "boolean") {
      force = color;
      color = "blue";
    }

    const { isRepeat, count } = checkIfRepeat("debug", text);

    if (!force && isRepeat && suppressionConfig.enabled) {
      // Просто обновляем счетчик, не выводим
      return;
    }

    if (isRepeat && count > 0 && suppressionConfig.showCounter) {
      const counterText = ` ${colorizeByText(`[×${count + 1}]`, "dim")}`;
      console.debug(colorizeByText(text, color) + counterText);
    } else {
      console.debug(colorizeByText(text, color));
    }
  },

  /**
   * Вывод информационного сообщения (обычный цвет)
   * @param {string} text - Текст сообщения
   * @param {string|null} color - Цвет сообщения
   * @param {boolean} [force=false] - Принудительный вывод, игнорируя подавление
   */
  info: (text, color = null, force = false) => {
    if (typeof color === "boolean") {
      force = color;
      color = null;
    }

    const { isRepeat, count } = checkIfRepeat("info", text);

    if (!force && isRepeat && suppressionConfig.enabled) {
      return;
    }

    if (!color) {
      if (isRepeat && count > 0 && suppressionConfig.showCounter) {
        console.info(`${text} ${colorizeByText(`[×${count + 1}]`, "dim")}`);
      } else {
        console.info(text);
      }
    } else {
      if (isRepeat && count > 0 && suppressionConfig.showCounter) {
        console.info(
          colorizeByText(text, color) +
            colorizeByText(` [×${count + 1}]`, "dim")
        );
      } else {
        console.info(colorizeByText(text, color));
      }
    }
  },

  /**
   * Вывод предупреждения (желтый цвет)
   * @param {string} text - Текст предупреждения
   * @param {string|null} color - Цвет предупреждения
   * @param {boolean} [force=false] - Принудительный вывод, игнорируя подавление
   */
  warn: (text, color = "yellow", force = false) => {
    if (typeof color === "boolean") {
      force = color;
      color = "yellow";
    }
    const { isRepeat, count } = checkIfRepeat("warn", text);

    if (!force && isRepeat && suppressionConfig.enabled) {
      // Просто обновляем счетчик, не выводим
      return;
    }

    if (isRepeat && count > 0 && suppressionConfig.showCounter) {
      const counterText = ` ${colorizeByText(`[×${count + 1}]`, "dim")}`;
      console.warn(colorizeByText(text, color) + counterText);
    } else {
      console.warn(colorizeByText(text, color));
    }
  },

  /**
   * Вывод ошибки (красный цвет)
   * @param {string} text - Текст ошибки
   * @param {string|null} color - Цвет ошибки
   * @param {boolean} [force=false] - Принудительный вывод, игнорируя подавление
   */
  error: (text, color = "red", force = false) => {
    if (typeof color === "boolean") {
      force = color;
      color = "red";
    }
    const { isRepeat, count } = checkIfRepeat("error", text);

    if (!force && isRepeat && suppressionConfig.enabled) {
      // Просто обновляем счетчик, не выводим
      return;
    }

    if (isRepeat && count > 0 && suppressionConfig.showCounter) {
      const counterText = ` ${colorizeByText(`[×${count + 1}]`, "dim")}`;
      console.error(colorizeByText(text, color) + counterText);
    } else {
      console.error(colorizeByText(text, color));
    }
  },

  /**
   * Вывод текста с произвольным цветом
   * @param {string} text - Текст для вывода
   * @param {string} color - Цветовой код (имя, HEX, RGB)
   * @param {boolean} [force=false] - Принудительный вывод, игнорируя подавление
   */
  print: (text, color, force = false) => {
    if (typeof color === "boolean") {
      force = color;
      color = undefined;
    }
    const { isRepeat, count } = checkIfRepeat("print", text);

    if (!force && isRepeat && suppressionConfig.enabled) {
      // Просто обновляем счетчик, не выводим
      return;
    }

    if (isRepeat && count > 0 && suppressionConfig.showCounter) {
      const counterText = ` ${colorizeByText(`[×${count + 1}]`, "dim")}`;
      console.log(colorizeByText(text, color) + counterText);
    } else {
      console.log(colorizeByText(text, color));
    }
  },

  /**
   * Расширенное форматирование с опциями
   * @param {string} text - Текст для форматирования
   * @param {Object} options - Опции форматирования
   * @param {boolean} [force=false] - Принудительный вывод, игнорируя подавление
   */
  custom: (text, options, force = false) => {
    const { isRepeat, count } = checkIfRepeat("custom", text);

    if (!force && isRepeat && suppressionConfig.enabled) {
      // Просто обновляем счетчик, не выводим
      return;
    }

    if (isRepeat && count > 0 && suppressionConfig.showCounter) {
      const counterText = ` ${colorizeByText(`[×${count + 1}]`, "dim")}`;
      console.log(prepareCustomLog(text, options) + counterText);
    } else {
      console.log(prepareCustomLog(text, options));
    }
  },

  /**
   * Сброс истории повторяющихся логов
   */
  resetSuppression: () => {
    Object.keys(lastLogs).forEach((key) => {
      lastLogs[key] = { text: null, timestamp: 0 };
    });
    repeatCounters.clear();
  },

  /**
   * Получить статистику повторений
   * @returns {Object} Статистика
   */
  getSuppressionStats: () => {
    return {
      config: { ...suppressionConfig },
      counters: Array.from(repeatCounters.entries()).map(([key, count]) => ({
        key,
        count,
      })),
    };
  },
  /**
   * Включить подавление логов
   */
  enableSuppression: () => {
    configureLogSuppression({ enabled: true });
  },

  /**
   * Выключить подавление логов
   */
  disableSuppression: () => {
    configureLogSuppression({ enabled: false });
  },
};
