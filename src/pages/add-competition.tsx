import { zodResolver } from "@hookform/resolvers/zod";
import { atom, useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/router";
import { type ChangeEvent, useEffect, useState } from "react";
import { type DateRange } from "react-day-picker";
import {
  type SubmitHandler,
  useForm,
  type UseFormSetValue,
  type UseFormGetValues,
  type UseFormTrigger,
  type UseFormStateReturn,
  type UseFormReset,
} from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { type LayoutProps } from "~/components/layout";
import { DateRangePicker } from "~/components/form/date-range-picker";
import { api } from "~/utils/api";
import { competitionSchema } from "~/utils/schemas";
import { cn } from "~/utils/tailwind-merge";
import { useProtectedPage } from "~/utils/useProtectedPage";
import { useUploadThing } from "~/utils/uploadthing";

export function getStaticProps() {
  return {
    props: {
      layout: {
        title: "Dodaj konkurencję",
        description: "Dodaj konkurencję do Koła Gospodyń Wiejskich",
      } satisfies LayoutProps,
    },
  };
}

export const dateRangeAtom = atom<DateRange | undefined>(undefined);

const formSchema = competitionSchema.omit({ imageUrl: true }).extend({
  imageFile: z.custom<File>((file) => file instanceof File, {
    message: "Zdjęcie poglądowe jest wymagane",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddCompetitionPage() {
  useResetDateRangeAtom();

  const [customIsLoading, setCustomIsLoading] = useState(false);
  const [imgUploadPercent, setImgUploadPercent] = useState(0);
  const router = useRouter();
  const utils = api.useContext();

  const { mutate: addCompetition } = api.competition.addNew.useMutation({
    onSuccess: async ({ id }) => {
      await router.push(`/competition/${id}`);
      await Promise.allSettled([
        utils.competition.getAll.invalidate(),
        utils.competition.getAllTakenDateRanges.invalidate(),
      ]);
    },
    onError: (error) => {
      if (
        error.data?.code === "CONFLICT" ||
        error.data?.code === "BAD_REQUEST"
      ) {
        setError("startsAt", { type: "server", message: error.message });
        setError("endsAt", { type: "server", message: error.message });
      } else {
        toast.error("Błąd serwera, spróbuj ponownie");
      }
      setImgUploadPercent(0);
      setCustomIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    setError,
    watch,
    clearErrors,
    setValue,
    getValues,
    reset,
    trigger,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  watch((_, { name }) => {
    if (name !== "startsAt" && name !== "endsAt") return;

    if (
      errors.startsAt?.type === "server" ||
      errors.endsAt?.type === "server"
    ) {
      clearErrors(["startsAt", "endsAt"]);
    }
  });

  useSyncFormStateToDateRangePicker({
    setValue,
    getValues,
    reset,
    trigger,
    isSubmitted,
  });

  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    "imageUploader",
    {
      onUploadProgress: setImgUploadPercent,
      onUploadError: (error) => {
        setError("imageFile", { type: "server", message: error.message });
        setImgUploadPercent(0);
        setCustomIsLoading(false);
      },
    },
  );

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setCustomIsLoading(true);

    const res = await startUpload([data.imageFile]);

    // Error message is handled as a callback above
    if (!res?.[0]?.url) return;

    const correctEndsAt = new Date(data.endsAt.getTime());
    correctEndsAt.setSeconds(correctEndsAt.getSeconds() - 1);
    correctEndsAt.setDate(correctEndsAt.getDate() + 1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageFile: _, endsAt: __, ...dataToMakeFinal } = data;

    const finalData = {
      ...dataToMakeFinal,
      endsAt: correctEndsAt,
      imageUrl: res[0].url,
    };

    addCompetition(finalData);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;

    if (!fileList || fileList.length === 0 || !fileList[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageFile: _, ...currentValues } = getValues();
      reset(currentValues, { keepIsSubmitted: true, keepErrors: true });

      if (isSubmitted) await trigger("imageFile");
      return;
    }

    setValue("imageFile", fileList[0]);
    if (isSubmitted) await trigger("imageFile");
  };

  const { isUnauthed } = useProtectedPage();
  if (isUnauthed) return null;

  const maxImageSize = permittedFileInfo?.config.image?.maxFileSize;

  return (
    <div className="w-[80vw] space-y-4 sm:w-96">
      <h1 className="text-4xl font-bold dark:text-primary-content">
        Dodaj <span className="text-primary">konkurencję</span>
      </h1>
      <p>
        Podaj nazwę <span className="text-primary">konkurencji</span>, oraz
        przedział czasu w jakim ma się wydarzyć
      </p>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col">
          <label htmlFor="name" className="label label-text">
            Nazwa
          </label>
          <input
            placeholder="Ciasteczka..."
            type="text"
            id="name"
            {...register("name")}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.name,
            })}
          />
          {errors.name && (
            <div className="label label-text-alt text-error">
              {errors.name.message}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="image" className="label label-text">
            Zdjęcie poglądowe
          </label>
          <input
            accept="image/*"
            placeholder="Wybierz zdjęcie poglądowe"
            type="file"
            id="image"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onChange={handleFileChange}
            disabled={customIsLoading}
            className={cn("file-input file-input-bordered", {
              "file-input-error text-error": errors.imageFile,
            })}
          />
          {errors.imageFile && (
            <div className="label label-text-alt text-error">
              {errors.imageFile.message}
            </div>
          )}
          {!!maxImageSize && (
            <div className="label label-text-alt">
              Maksymalny rozmiar: {maxImageSize}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="dateRange" className="label label-text">
            Przedział czasu
          </label>
          <DateRangePicker
            isError={!!errors.startsAt || !!errors.endsAt}
            isLoading={customIsLoading}
          />
          {errors.startsAt && (
            <div className="label label-text-alt text-error">
              {errors.startsAt.message}
            </div>
          )}
          {!errors.startsAt && errors.endsAt && (
            <div className="label label-text-alt text-error">
              {errors.endsAt.message}
            </div>
          )}
          <div className="label label-text-alt">
            Ustaw tydzień w przypadku braku sytuacji nadzwyczajnej
          </div>
        </div>
        <button disabled={customIsLoading} className="btn btn-primary mt-2">
          Dodaj
        </button>
        {isUploading && (
          <>
            <progress
              className="progress progress-primary"
              value={imgUploadPercent}
              max="100"
            />
            <p className="text-center">
              Przesyłanie zdjęcia:{" "}
              <span className="text-primary">{imgUploadPercent}%</span>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

const useSyncFormStateToDateRangePicker = ({
  setValue,
  reset,
  getValues,
  isSubmitted,
  trigger,
}: {
  setValue: UseFormSetValue<FormSchema>;
  reset: UseFormReset<FormSchema>;
  getValues: UseFormGetValues<FormSchema>;
  isSubmitted: UseFormStateReturn<FormSchema>["isSubmitted"];
  trigger: UseFormTrigger<FormSchema>;
}) => {
  const [dateRangeValue, setDateRange] = useAtom(dateRangeAtom);

  useEffect(() => {
    if (!dateRangeValue) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { startsAt: _, endsAt: __, ...currentValues } = getValues();
      reset(currentValues, { keepIsSubmitted: true, keepErrors: true });

      if (isSubmitted) {
        void trigger("startsAt");
        void trigger("endsAt");
      }
      return;
    }
    if (dateRangeValue.from) setValue("startsAt", dateRangeValue.from);
    else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { startsAt: _, ...currentValues } = getValues();
      reset(currentValues, { keepIsSubmitted: true, keepErrors: true });
    }
    if (dateRangeValue.to) setValue("endsAt", dateRangeValue.to);
    else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { endsAt: _, ...currentValues } = getValues();
      reset(currentValues, { keepIsSubmitted: true, keepErrors: true });
    }
    if (isSubmitted) {
      void trigger("startsAt");
      void trigger("endsAt");
    }
  }, [
    dateRangeValue,
    setDateRange,
    reset,
    getValues,
    isSubmitted,
    trigger,
    setValue,
  ]);
};

const useResetDateRangeAtom = () => {
  const setDateRange = useSetAtom(dateRangeAtom);
  useEffect(() => () => setDateRange(undefined), [setDateRange]);
};
