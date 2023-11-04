import {
  FIRST_PLACE_POINTS,
  SECOND_PLACE_POINTS,
  THIRD_PLACE_POINTS,
} from "~/utils/constants";

type UserPointsType = {
  name: string;
  value: number;
};

export const toPlacements = (userPointsArray: UserPointsType[]) => {
  const placesMap = new Map<number, UserPointsType[]>();

  let currentPlaceIndex = 0;

  for (const userPoints of userPointsArray) {
    const currentPlace = placesMap.get(currentPlaceIndex);

    if (!currentPlace?.[0]) {
      placesMap.set(currentPlaceIndex, [userPoints]);
      continue;
    }

    if (userPoints.value === currentPlace[0].value) {
      currentPlace.push(userPoints);
      continue;
    }

    placesMap.set(++currentPlaceIndex, [userPoints]);
  }

  return Array.from(placesMap, ([placeIndex, userPoints]) => ({
    placeIndex,
    fullNames: userPoints.map(({ name }) => name),
  }));
};

export const toPlacementPoints = (userPointsArray: UserPointsType[]) => {
  const placesToReceivePoints = [
    FIRST_PLACE_POINTS,
    SECOND_PLACE_POINTS,
    THIRD_PLACE_POINTS,
  ];

  return toPlacements(userPointsArray)
    .filter(({ placeIndex }) => placeIndex < placesToReceivePoints.length)
    .map(({ placeIndex, fullNames }) => ({
      points: placesToReceivePoints[placeIndex]!,
      fullNames,
    }));
};
