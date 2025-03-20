import { Menu, clipboard, ipcMain } from "electron";
import Store from "electron-store";
import { stopServer, startServer, getServerInfo } from "./serverControl";
import axios from "axios";

const store = new Store();
const API_BASE_URL = "http://10.20.11.150:9061/api/operator";
const API_CAMERAS_BASE_URL = "http://10.20.11.150:9061/api/camera/operators";

const getCheckboxState = () => store.get("checkboxState", false);
const updateCheckboxState = (state) => store.set("checkboxState", state);

const getSelectedOperator = () => store.get("selectedOperator", null);
const updateSelectedOperator = (mainWindow, operatorId) => {
  mainWindow.webContents.send("selected-operator", operatorId);

  store.set("selectedOperator", operatorId);
};

export const handleCheckboxToggle = async (newState, mainWindow) => {
  updateCheckboxState(newState);

  if (newState) {
    await stopServer();
  } else {
    startServer(mainWindow);
  }

  updateMenu(mainWindow);
};

const copyToClipboard = (text) => {
  clipboard.writeText(text);
};

const fetchOperators = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении операторов:", error);
    return [];
  }
};

const fetchCameras = async (operatorId) => {
  try {
    const response = await axios.get(`${API_CAMERAS_BASE_URL}/${operatorId}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении камер оператора ${operatorId}:`, error);
    return [];
  }
};

const addOperator = async (mainWindow) => {
  try {
    const newOperator = { name: "Новый оператор" };
    await axios.post(API_BASE_URL, newOperator);
    updateMenu(mainWindow);
  } catch (error) {
    console.error("Ошибка при добавлении оператора:", error);
  }
};

const deleteOperator = async (operatorId, mainWindow) => {
  try {
    await axios.delete(`${API_BASE_URL}/${operatorId}`);
    updateMenu(mainWindow);
  } catch (error) {
    console.error(`Ошибка при удалении оператора ${operatorId}:`, error);
  }
};

const createMainMenuTemplate = (mainWindow) => {
  const isChecked = getCheckboxState();
  const serverInfo = getServerInfo();

  return [
    {
      label: "Parkly",
      submenu: [
        {
          label: "Переключиться на клиента",
          type: "checkbox",
          checked: isChecked,
          click: (menuItem) => handleCheckboxToggle(menuItem.checked, mainWindow),
        },
        {
          label: `IP сервера: ${serverInfo}`,
          click: () => copyToClipboard(serverInfo),
          enabled: serverInfo !== "Не запущен",
        },
        { label: "Выход", role: "quit" },
      ],
    },
  ];
};

const createOperatorsMenuTemplate = async (mainWindow) => {
  const operators = await fetchOperators();
  const selectedOperator = getSelectedOperator();

  return {
    label: "Операторы",
    submenu: [
      {
        label: "Обновить список",
        click: async () => {
          updateMenu(mainWindow);
        },
      },
      {
        label: "Добавить оператора",
        click: () => addOperator(mainWindow),
      },
      { type: "separator" },
      ...(await Promise.all(
        operators.map(async (operator) => {
          const cameras = await fetchCameras(operator.id);
          return {
            label: operator.name,
            submenu: [
              ...(cameras.length > 0
                ? cameras.map((camera) => ({
                    label: camera.name,
                    enabled: false,
                  }))
                : [{ label: "Нет доступных камер", enabled: false }]),
              { type: "separator" },

              {
                label: "Добавить камеру",
                click: () => {
                  mainWindow.webContents.send("add-camera", operator.id);
                },
              },
              {
                label: "Выбрать оператора",
                type: "radio",
                checked: operator.id === selectedOperator,
                click: () => {
                  updateSelectedOperator(mainWindow, operator.id);
                  updateMenu(mainWindow);
                },
              },
              {
                label: "Удалить оператора",
                click: () => deleteOperator(operator.id, mainWindow),
              },
            ],
          };
        })
      )),
    ],
  };
};

export const updateMenu = async (mainWindow) => {
  const mainMenuTemplate = createMainMenuTemplate(mainWindow);
  const operatorsMenuTemplate = await createOperatorsMenuTemplate(mainWindow);

  const menu = Menu.buildFromTemplate([...mainMenuTemplate, operatorsMenuTemplate]);
  Menu.setApplicationMenu(menu);
};

ipcMain.on("request-add-camera", (event, operatorId) => {
  console.log("Добавление камеры для оператора:", operatorId);
});

ipcMain.handle("get-selected-operator", () => getSelectedOperator());

ipcMain.on("request-selected-operator", (event) => {
  event.sender.send("selected-operator", getSelectedOperator());
});
