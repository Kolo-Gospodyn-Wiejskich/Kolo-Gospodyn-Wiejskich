import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import polishLocale from "dayjs/locale/pl";

dayjs.extend(relativeTime);
dayjs.locale(polishLocale);

export const dateToRelative = (date: Date) => dayjs(date).fromNow();
