"use strict";

const contactsList = document.querySelector(".contacts-list");
const templateContact = document.querySelector("#contact");
const templateDetailsItem = document.querySelector("#details-item");
const details = document.querySelector(".details-view");
const detailsList = document.querySelector(".details-list");
const backButton = document.querySelector(".back");
const fragment = document.createDocumentFragment();

let contactsData;

/**
 * Функция подгружает JSON, затем
 * вызывает функцию рендера контактов
 */
const getContacts = function () {
  fetch("./data.json")
    .then((res) => res.json())
    .then((data) => {
      contactsData = data;
      showContacts(data);
    });
};

/**
 * Функция копирует шаблон для каждого контакта,
 * заполняет его и встраивает в разметку
 */
const showContacts = function (contacts) {
  if (!contacts.length) {
    throw Error(`Contacts list is empty.`);
  }
  let idCounter = 1;
  contacts.forEach((el) => {
    const id = el.id;
    const name = el.name;
    const clone = templateContact.content.cloneNode(true);
    const item = clone.querySelector("li");
    const nameField = clone.querySelector("strong");

    item.dataset.id = id;
    nameField.innerText = name;
    fragment.appendChild(clone);
    idCounter++;
  });
  contactsList.appendChild(fragment);
};

/**
 * Функция заполняет ul разметкой,
 * создает массивы друзей, недрузей и популярных людей,
 * и передает их в функции рендера
 */
const renderDetails = function (id) {
  const index = id - 1; // все id исходного массива = индекс + 1
  const name = contactsData[index].name;
  const friends = contactsData[index].friends;
  const [nonFriends, sortedByPopularity] = getNonFriendsAndPopular(id, friends);

  // используется innerHTML, т.к. разметка очищается при нажатии кнопки назад (возврате к контактам)
  detailsList.innerHTML = `
            <li class="people-title people-title-name">${name}</li>
            <li class="people-title friends">Друзья</li>
            <li class="people-title not-in-friends">Не в друзьях</li>
            <li class="people-title popular">Популярные люди</li>
            `;

  renderFriends(friends);
  renderNonFriends(nonFriends);
  renderPopular(sortedByPopularity);
};

/**
 * Функция создает массив недрузей и объект для подсчета частотности нахождения в друзьях,
 * проходим по исходному массиву и проверяем, что такого индекса нет в массиве friends выбранного человека,
 * а также что это не собственный индекс выбранного человека - если так, добавляем в массив недрузей
 *
 * в этом же обходе исходного массива считаем количество повторений каждого человека в друзьях
 * и записываем результаты подсчета в объект popular (ключ - id, значение - кол-во повторений)
 *
 * возвращает массивы недрузей и отсортированных популярных людей
 */
function getNonFriendsAndPopular(id, friends) {
  let nonFriends = [];
  let popular = {};

  contactsData.forEach((el) => {
    if (
      el.id !== +id &&
      friends.find((friend) => friend === el.id) === undefined
    ) {
      nonFriends.push(el.id);
    }

    el.friends.forEach((friend) => {
      popular.hasOwnProperty(friend)
        ? popular[friend]++
        : (popular[friend] = 1);
    });
  });

  const sortedByPopularity = sortPopular(popular);
  return [nonFriends, sortedByPopularity];
}

/**
 * Функция сортировки популярных людей, принимает объект (ключ - id, значение - кол-во повторений),
 * возвращает массив отсортированных по популярности (и при необходимости - по имени) людей
 */
function sortPopular(obj) {
  /**
   * Сортируем людей по частотности нахождения в друзьях, затем проверяем,
   * нужно ли дополнительно сортировать по имени (если у 3 и 4 позиции одинаковая частотность, то нужно), -
   * вызываем функцию сортировки по имени и передаем туда массив всех людей с конкурирующей частотностью (arrToSortByName)
   */
  const sortedByValueArr = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (sortedByValueArr[2][1] === sortedByValueArr[3][1]) {
    let arrToSortByName = sortedByValueArr.filter(
      (item) => item[1] === sortedByValueArr[2][1]
    );
    const sortedByName = sortByName(arrToSortByName);

    /**
     * Получаем индекс, с которого начинаются элементы, которые будем сортировать по имени.
     * Заменяем в массиве sortedByValueArr конкурирующие элементы на отсортированные по алфавиту,
     * начиная с найденного ранее индекса
     */
    let indexToReplace = sortedByValueArr.findIndex(
      (item) => item[1] === sortedByValueArr[2][1]
    );
    sortedByName.forEach((item) => {
      sortedByValueArr[indexToReplace] = item;
      indexToReplace++;
    });
  }
  return sortedByValueArr;
}

/**
 * функция рендера 3-х друзей, принимает массив друзей (по условию, их всегда три у любого человека)
 * Добавляем друзей, проходсь по массиву friends в данных выбранного человека
 *
 * el - 1 - индекс друга в исходном массиве данных
 */
function renderFriends(arr) {
  const friendsTitle = document.querySelector(".friends");
  arr.forEach((el) => {
    const clone = templateDetailsItem.content.cloneNode(true);
    const nameField = clone.querySelector("span");
    nameField.innerText = contactsData[el - 1].name;
    fragment.appendChild(clone);
  });
  detailsList.insertBefore(fragment, friendsTitle.nextSibling);
}

/**
 * функция рендера 3-х недрузей
 * принимает массив недрузей и выводит на страницу первых трех
 *
 * (nonFriends[i] - 1) - индекс человека в исходном массиве данных
 */
function renderNonFriends(arr) {
  const nonFriendsTitle = document.querySelector(".not-in-friends");
  for (let i = 0; i < 3; i++) {
    const clone = templateDetailsItem.content.cloneNode(true);
    const nameField = clone.querySelector("span");
    nameField.innerText = contactsData[arr[i] - 1].name;
    fragment.appendChild(clone);
  }
  detailsList.insertBefore(fragment, nonFriendsTitle.nextSibling);
}

/**
 * функция рендера 3-х самых популярных людей
 * принимает массив, отсортированный по популярности и алфавиту
 */
function renderPopular(arr) {
  const popularTitle = document.querySelector(".popular");
  for (let i = 0; i < 3; i++) {
    const clone = templateDetailsItem.content.cloneNode(true);
    const nameField = clone.querySelector("span");
    nameField.innerText = contactsData[arr[i][0] - 1].name;
    fragment.appendChild(clone);
  }
  detailsList.insertBefore(fragment, popularTitle.nextSibling);
}

/**
 * Функция принимает массив всех людей с одинаковой частотностью
 *  вида ['id человека', частотность его нахождения в друзьях],
 * которых нужно отсортировать по имени
 * Возвращает новый массив того же вида, отсортированный по именам
 */
function sortByName(arr) {
  return [...arr].sort((a, b) => {
    let nameA = contactsData[a[0] - 1].name.toLowerCase();
    let nameB = contactsData[b[0] - 1].name.toLowerCase();
    if (nameA < nameB) return -1; //сортируем строки по возрастанию
    if (nameA > nameB) return 1;
    return 0; // Никакой сортировки
  });
}

/**
 * Функция переключает класс открытия на странице деталей контакта
 */
const toggleDetails = function () {
  details.classList.toggle("open");
};

/**
 * Обработчик события click по контактам.
 * Открывает окно деталей контакта и передает
 * в функцию рендера id для заполнения деталей
 */
const contactHandler = function (evt) {
  evt.preventDefault();
  const currentContact = evt.target.closest("li");
  if (currentContact) {
    toggleDetails();
    renderDetails(currentContact.dataset.id);
  }
};

/**
 * Обработчик события click по кнопке Назад.
 * скрывает страницу с деталями контакта
 */
const backButtonHandler = function (evt) {
  evt.preventDefault();
  toggleDetails();
  detailsList.innerHTML = "";
};

contactsList.addEventListener("click", contactHandler);
backButton.addEventListener("click", backButtonHandler);

getContacts();
