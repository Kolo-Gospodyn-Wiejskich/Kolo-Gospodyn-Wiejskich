import { zodResolver } from "@hookform/resolvers/zod";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { useRouter } from "next/router";
import { type ChangeEvent, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import SuperJSON from "superjson";
import { z } from "zod";
import { type LayoutProps } from "~/components/layout";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { api } from "~/utils/api";
import { entrySchema } from "~/utils/schemas";
import { cn } from "~/utils/tailwind-merge";
import { useUploadThing } from "~/utils/uploadthing";
import { useProtectedPage } from "~/utils/useProtectedPage";

export async function getServerSideProps() {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, session: null },
    transformer: SuperJSON,
  });

  await helpers.competition.getActive.prefetch();

  return {
    props: {
      trpcState: helpers.dehydrate(),
      layout: {
        title: "Dodaj wypiek",
        description:
          "Dodaj wypiek do obecnej konkurencji Koła Gospodyń Wiejskich",
      } satisfies LayoutProps,
    },
  };
}

const formSchema = entrySchema.omit({ imageUrl: true }).extend({
  imageFile: z.custom<File>((file) => file instanceof File, {
    message: "Zdjęcie poglądowe jest wymagane",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddEntryPage() {
  const router = useRouter();
  const utils = api.useContext();
  const [customIsLoading, setCustomIsLoading] = useState(false);
  const [imgUploadPercent, setImgUploadPercent] = useState(0);

  const { data: activeCompetition, error } = useActiveCompetition();

  const { mutate: addNewEntry } = api.entry.addNew.useMutation({
    onSuccess: async ({ competitionId }) => {
      void Promise.allSettled([
        utils.entry.getAllWithRatingsByCompetitionId.invalidate({
          id: competitionId,
        }),
        utils.entry.getAllWithoutRatingsByCompetitionId.invalidate({
          id: competitionId,
        }),
      ]);
      await router.push(`/competition/${competitionId}`);
    },
    onError: () => {
      toast.error("Błąd serwera, spróbuj ponownie");
      setImgUploadPercent(0);
      setCustomIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    setError,
    setValue,
    getValues,
    reset,
    trigger,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageFile: _, ...dataWithNoFile } = data;

    const finalData = {
      ...dataWithNoFile,
      imageUrl: res[0].url,
    };

    addNewEntry(finalData);
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

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error fetching active competition: {error.message}
      </div>
    );

  const maxImageSize = permittedFileInfo?.config.image?.maxFileSize;

  return (
    <div className="w-[80vw] space-y-4 sm:w-96">
      <h1 className="text-4xl font-bold dark:text-primary-content">
        Dodaj wypiek{" "}
        <span className="text-secondary">
          {activeCompetition?.competition?.name ?? "wypiek"}
        </span>
      </h1>
      <p>
        Podaj nazwę twojego <span className="text-secondary">wypieku</span>,
        ewentualny opis oraz zdjęcie
      </p>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col">
          <label htmlFor="title" className="label label-text">
            Nazwa
          </label>
          <input
            placeholder="Ciasteczka z karmelem..."
            type="text"
            id="title"
            {...register("title")}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.title,
            })}
          />
          {errors.title && (
            <div className="label label-text-alt text-error">
              {errors.title.message}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="description" className="label label-text">
            Opis (opcjonalnie)
          </label>
          <input
            placeholder="Użyłem cukru brązowego..."
            type="text"
            id="description"
            {...register("description")}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.description,
            })}
          />
          {errors.description && (
            <div className="label label-text-alt text-error">
              {errors.description.message}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="image" className="label label-text">
            Zdjęcie
          </label>
          <input
            accept="image/*"
            placeholder="Wybierz zdjęcie"
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
        <button disabled={customIsLoading} className="btn btn-secondary mt-2">
          Dodaj
        </button>
        {isUploading && (
          <>
            <progress
              className="progress progress-secondary"
              value={imgUploadPercent}
              max="100"
            />
            <p className="text-center">
              Przesyłanie zdjęcia:{" "}
              <span className="text-secondary">{imgUploadPercent}%</span>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

const useActiveCompetition = () => {
  const router = useRouter();
  const { data, error } = api.competition.getActive.useQuery();

  if (data && !data.isActive) void router.push("/");

  return { data, error };
};
