"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { LogActivityButton } from "@/components/log-activity-button";
import { placeClient } from "@/lib/actions/clients";
import { STATUSES, money, type Client, type Status } from "@/lib/types";

export type Card = Pick<Client, "id" | "name" | "company" | "value" | "status"> & {
  ownerName: string | null;
  /** Days since the card last changed (computed on the server to avoid hydration drift). */
  days: number;
};
type Columns = Record<Status, Card[]>;

const STALE_DAYS = 14;

const group = (cards: Card[]): Columns =>
  Object.fromEntries(STATUSES.map((s) => [s, cards.filter((c) => c.status === s)])) as Columns;

function CardBody({ card }: { card: Card }) {
  const stale = card.days >= STALE_DAYS && card.status !== "Won" && card.status !== "Lost";
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{card.name}</div>
          <div className="truncate text-xs text-slate-500">{card.company}</div>
        </div>
        {card.ownerName && <Avatar name={card.ownerName} size={24} />}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium tabular-nums">{money(card.value)}</span>
        <span
          className={
            stale
              ? "rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              : "text-slate-400"
          }
        >
          {card.days === 0 ? "today" : `${card.days}d`}
        </span>
      </div>
    </>
  );
}

const cardClass =
  "rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900";

function SortableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    // Animate every layout shift, including cards displaced when a card enters or leaves their column.
    animateLayoutChanges: () => true,
    transition: { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // The original card stays as a faded placeholder while the overlay follows the pointer.
      className={`${cardClass} cursor-grab touch-manipulation select-none ${isDragging ? "opacity-30" : ""}`}
    >
      <Link href={`/clients/${card.id}`} draggable={false} className="block hover:text-brand-600">
        <CardBody card={card} />
      </Link>
      <div className="mt-1 flex justify-end">
        <LogActivityButton clientId={card.id} clientName={card.name} />
      </div>
    </div>
  );
}

function Column({ status, cards, grand }: { status: Status; cards: Card[]; grand: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = cards.reduce((s, c) => s + Number(c.value), 0);
  const share = grand > 0 ? Math.round((total / grand) * 100) : 0;
  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-slate-100 p-3 transition-shadow duration-200 dark:bg-slate-900/60 ${
        isOver ? "ring-2 ring-brand-400" : ""
      }`}
    >
      <div className="flex items-baseline justify-between text-sm font-medium">
        {status}
        <span className="text-xs font-normal text-slate-500">
          {cards.length} · {money(total)}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" title={`${share}% of pipeline value`}>
        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-300" style={{ width: `${share}%` }} />
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-col gap-2">
          {cards.map((c) => (
            <SortableCard key={c.id} card={c} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ clients }: { clients: Card[] }) {
  const [columns, setColumns] = useState<Columns>(() => group(clients));
  const [active, setActive] = useState<Card | null>(null);
  const startStatus = useRef<Status | null>(null);
  const before = useRef<Columns | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  // Prefer the card under the pointer so neighbours shift. A column only wins when the pointer is over its
  // empty space, and then we pick the nearest card inside that column (or the column itself if it is empty).
  const collision: CollisionDetection = (args) => {
    const hits = pointerWithin(args);
    const card = hits.find((h) => !(STATUSES as readonly string[]).includes(String(h.id)));
    if (card) return [card];

    const column = hits.find((h) => (STATUSES as readonly string[]).includes(String(h.id)));
    if (!column) return closestCenter(args);
    const ids = new Set(columns[column.id as Status].map((c) => c.id));
    const inColumn = args.droppableContainers.filter((c) => ids.has(String(c.id)));
    return inColumn.length ? closestCenter({ ...args, droppableContainers: inColumn }) : [column];
  };

  const findColumn = (id: string | number): Status | undefined =>
    (STATUSES as readonly string[]).includes(String(id))
      ? (id as Status)
      : STATUSES.find((s) => columns[s].some((c) => c.id === id));

  function onDragStart(e: DragStartEvent) {
    const status = findColumn(e.active.id);
    startStatus.current = status ?? null;
    before.current = columns;
    setActive(status ? (columns[status].find((c) => c.id === e.active.id) ?? null) : null);
  }

  // Move the card into the hovered column live, so neighbours slide out of the way.
  function onDragOver(e: DragOverEvent) {
    const { active: a, over } = e;
    if (!over) return;
    const from = findColumn(a.id);
    const to = findColumn(over.id);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const moving = prev[from].find((c) => c.id === a.id);
      if (!moving) return prev;
      const target = prev[to];
      const overIndex = target.findIndex((c) => c.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : target.length;
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== a.id),
        [to]: [...target.slice(0, insertAt), { ...moving, status: to }, ...target.slice(insertAt)],
      };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    const origin = startStatus.current;
    const snapshot = before.current;
    setActive(null);
    startStatus.current = null;
    before.current = null;
    if (!over || !origin) return;

    const to = findColumn(a.id);
    if (!to) return;

    let next = columns;
    const oldIndex = columns[to].findIndex((c) => c.id === a.id);
    const newIndex = columns[to].findIndex((c) => c.id === over.id);
    if (newIndex >= 0 && oldIndex !== newIndex) {
      next = { ...columns, [to]: arrayMove(columns[to], oldIndex, newIndex) };
      setColumns(next);
    }

    const changedStage = origin !== to;
    const moved = snapshot ? snapshot[to].map((c) => c.id).join() !== next[to].map((c) => c.id).join() : true;
    if (!changedStage && !moved) return;

    const result = await placeClient(String(a.id), to, next[to].map((c) => c.id), changedStage);
    if (result.error) {
      toast.error(result.error);
      if (snapshot && !result.error.includes("migration")) setColumns(snapshot);
    }
  }

  return (
    <DndContext
      id="pipeline-board" // stable id avoids a server/client hydration mismatch on aria-describedby
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        if (before.current) setColumns(before.current);
        setActive(null);
      }}
    >
      {/* Padding gives the highlight ring room so the scroll container doesn't clip it. */}
      <div className="-mx-2 flex gap-4 overflow-x-auto px-2 py-2 pb-4">
        {STATUSES.map((s) => (
          <Column
            key={s}
            status={s}
            cards={columns[s]}
            grand={STATUSES.reduce((sum, st) => sum + columns[st].reduce((x, c) => x + Number(c.value), 0), 0)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? (
          <div className={`${cardClass} rotate-2 scale-105 cursor-grabbing shadow-xl ring-1 ring-brand-300`}>
            <CardBody card={active} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
