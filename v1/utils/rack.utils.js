import mongoose from "mongoose";

const newId = () => new mongoose.Types.ObjectId();

// Reparte las columnas en tramos, con numeración corrida. El último tramo se queda con las que sobren
const buildBays = (columnCount, columnsPerBay) => {
    const bays = [];
    for (let number = 1; number <= columnCount; number += columnsPerBay) {
        const size = Math.min(columnsPerBay, columnCount - number + 1);
        const columns = Array.from({ length: size }, (_, index) => ({ label: String(number + index) }));
        bays.push({ _id: newId(), columns });
    }
    return bays;
};

// Disposición uniforme de una estantería nueva: una posición por columna en cada nivel, del nivel 1 hacia arriba
export const buildRackLayout = ({ levelCount, columnCount, columnsPerBay }) => {
    const bays = buildBays(columnCount, columnsPerBay);
    const levels = Array.from({ length: levelCount }, (_, levelIndex) => {
        const levelNumber = levelIndex + 1;
        let positionNumber = 0;
        const positions = bays.flatMap((bay) => bay.columns.map(() => {
            positionNumber += 1;
            return { bayId: bay._id, label: `${levelNumber}-${positionNumber}` };
        }));
        return { label: `N${levelNumber}`, positions };
    });
    return { bays, levels };
};

const firstRepeated = (labels) => {
    const seen = new Set();
    for (const label of labels) {
        const key = label.toLocaleLowerCase("es");
        if (seen.has(key)) return label;
        seen.add(key);
    }
    return null;
};

// Devuelve el motivo por el que la estantería no es válida, o null. Es lo que Joi no puede ver porque cruza listas
export const findRackProblem = ({ bays, levels }) => {
    const bayIds = bays.map((bay) => String(bay._id));

    const repeatedColumn = firstRepeated(bays.flatMap((bay) => bay.columns.map((column) => column.label)));
    if (repeatedColumn) return `La columna ${repeatedColumn} está repetida`;

    const repeatedLevel = firstRepeated(levels.map((level) => level.label));
    if (repeatedLevel) return `El nivel ${repeatedLevel} está repetido`;

    const repeatedPosition = firstRepeated(levels.flatMap((level) => level.positions.map((position) => position.label)));
    if (repeatedPosition) return `La posición ${repeatedPosition} está repetida`;

    for (const level of levels) {
        if (level.positions.some((position) => !bayIds.includes(String(position.bayId)))) {
            return `El nivel ${level.label} tiene una posición en un tramo que no existe`;
        }
        const usedBays = new Set(level.positions.map((position) => String(position.bayId)));
        if (usedBays.size !== bayIds.length) return `El nivel ${level.label} tiene un tramo sin posiciones`;
    }

    const blocked = levels.flatMap((level) => level.positions).find((position) => !position.active && position.fixedProduct);
    if (blocked) return `La posición ${blocked.label} está desactivada y no puede tener producto fijo`;

    return null;
};
