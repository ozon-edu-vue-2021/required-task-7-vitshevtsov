"use strict";

const contactsList = document.querySelector(".contacts-list");
const templateContact = document.querySelector("#contact");
const templateDetailsItem = document.querySelector("#details-item");
const details = document.querySelector(".details-view");
const detailsList = document.querySelector(".details-list");
const backButton = document.querySelector(".back");
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
  const fragment = document.createDocumentFragment();
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
 * затем встраивает в разметку друзей, недрузей
 * и популярных людей
 */
const renderDetails = function (id) {
  const index = id - 1; // все id исходного массива = индекс + 1
  const name = contactsData[index].name;
  const friends = contactsData[index].friends;
  const fragment = document.createDocumentFragment();

  detailsList.innerHTML = `
            <li class="people-title people-title-name">${name}</li>
            <li class="people-title friends">Друзья</li>
            <li class="people-title not-in-friends">Не в друзьях</li>
            <li class="people-title popular">Популярные люди</li>
            `;

  /**
   * Добавляем друзей, проходсь по массиву friends в данных выбранного человека
   * el - 1 - индекс друга в исходном массиве данных
   */
  const friendsTitle = document.querySelector(".friends");
  friends.forEach((el) => {
    const clone = templateDetailsItem.content.cloneNode(true);
    const nameField = clone.querySelector("span");
    nameField.innerText = contactsData[el - 1].name;
    fragment.appendChild(clone);
  });
  detailsList.insertBefore(fragment, friendsTitle.nextSibling);

  /**
   * Создаем массив недрузей, - проходим по исходному массиву и
   * проверяем, что такого индекса нет в массиве friends выбранного человека,
   * а также что это не собственный индекс выбранного человека - если так, добавляем в массив недрузей
   * далее считаем количество повторений каждого человека в друзьях и записываем в объект popular
   */
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

  /**
   * Сортируем людей по частотности нахождения в друзьях, затем проверяем,
   * нужно ли дополнительно сортировать по имени (если у 3 и 4 позиции одинаковая частотность, то нужно), -
   * вызываем функцию сортировки по имени и передаем туда массив всех людей с конкурирующей частотностью (arrToSortByName)
   */
  const sortedByValueArr = Object.entries(popular).sort((a, b) => b[1] - a[1]);
  if (sortedByValueArr[2][1] === sortedByValueArr[3][1]) {
    let arrToSortByName = sortedByValueArr.filter(
      (item) => item[1] === sortedByValueArr[2][1]
    );

    /**
     * Получаем индекс, с которого начинаются элементы, которые будем сортировать по имени,
     * а также все элементы с конкурирующим значением, отсортированные по алфавиту.
     * Заменяем в массиве sortedByValueArr конкурирующие элементы на сортированные по алфавиту,
     * начиная с найденного ранее индекса
     */
    let indexToReplace = sortedByValueArr.findIndex(
      (item) => item[1] === sortedByValueArr[2][1]
    );
    const sortedByName = sortByName(arrToSortByName);
    sortedByName.forEach((item) => {
      sortedByValueArr[indexToReplace] = item;
      indexToReplace++;
    });
  }

  /**
   * отрисовываем 3-х недрузей (первые 3 элемента массива недрузей)
   * nonFriends[i] - 1 - индекс человека в исходном массиве данных (id, хранящееся в
   * nonFriends - 1)
   */
  const nonFriendsTitle = document.querySelector(".not-in-friends");
  for (let i = 0; i < 3; i++) {
    const clone = templateDetailsItem.content.cloneNode(true);
    const nameField = clone.querySelector("span");
    nameField.innerText = contactsData[nonFriends[i] - 1].name;
    fragment.appendChild(clone);
  }
  detailsList.insertBefore(fragment, nonFriendsTitle.nextSibling);

  /**
   * отрисовываем 3-х самых популярных людей
   */
  const popularTitle = document.querySelector(".popular");
  for (let i = 0; i < 3; i++) {
    const clone = templateDetailsItem.content.cloneNode(true);
    const nameField = clone.querySelector("span");
    nameField.innerText = contactsData[sortedByValueArr[i][0] - 1].name;
    fragment.appendChild(clone);
  }
  detailsList.insertBefore(fragment, popularTitle.nextSibling);
};

/**
 * Функция принимает массив всех людей с одинаковой частотностью
 *  вида ['id человека', частотность его нахождения в друзьях],
 * которых нужно отсортировать по имени
 * Возвращает массив того же вида, отсортированный по именам
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
 * Запрашивает данные по картинке, на которую кликнули,
 * для открытия попапа с ней
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
