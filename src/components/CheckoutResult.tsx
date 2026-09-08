import Link from "next/link";

type Props = {
  emoji: string;
  title: string;
  message: string;
};

export function CheckoutResult({ emoji, title, message }: Props) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl">{emoji}</span>
      <h1 className="mt-4 text-xl font-bold text-zinc-800">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{message}</p>
      <Link
        href="/"
        className="mt-6 flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
