import { useState } from "react";
import { dummyTodos } from "@/logic/dummyDate";
import { Todo } from "@/logic/types";

type CustomTodoProps = {
  todos?: Todo[];
  showCheckbox?: boolean;
};

export default function CustomTodo({
  todos: initialTodos = dummyTodos,
  showCheckbox = true,
}: CustomTodoProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  // 新規追加モードの開閉と入力中テキスト
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState("");

  // 編集中のタスクIDと編集中テキスト
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // 完了状態の切り替え
  function toggleComplete(id: number) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  // 新規追加フォームの表示/非表示切り替え
  function tggleAddTodo() {
    setIsAdding((prev) => !prev);
    setNewText("");
  }

  // 新規タスクの登録
  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (newText.trim() === "") return;

    const newTodo: Todo = {
      id: Date.now(), // 簡易的な一意のID
      text: newText.trim(),
      completed: false,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setNewText("");
    setIsAdding(false);
  }

  // タスクの削除
  function onDeleteTodo(id: number) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  // 編集モードの開始
  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  // 編集内容の保存
  function saveEditing(id: number) {
    if (editText.trim() !== "") {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, text: editText.trim() } : todo
        )
      );
    }
    setEditingId(null);
  }

  return (
    <div>
      <h4 className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-600">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-500"></span>
          やること
        </span>
        <button
          type="button"
          onClick={tggleAddTodo}
          className="flex h-5 w-5 items-center justify-center rounded bg-sky-100 text-sky-700 transition hover:bg-sky-200 cursor-pointer"
          title="タスクを追加"
        >
          +
        </button>
      </h4>

      {/* 新規追加用インラインフォーム */}
      {isAdding && (
        <form onSubmit={handleAddTodo} className="mb-3 flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="新しいタスクを入力..."
            autoFocus
            className="flex-1 rounded border border-sky-300 bg-white px-2.5 py-1.5 text-xs text-sky-950 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
          >
            追加
          </button>
        </form>
      )}

      {todos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-400">
          やることはありません
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;

            return (
              <li
                key={todo.id}
                className="group flex items-center gap-2.5 rounded-lg border border-sky-100 bg-sky-50/40 p-3 text-xs text-sky-950 transition hover:bg-sky-50"
              >
                {showCheckbox && (
                  <input
                    type="checkbox"
                    checked={todo.completed ?? false}
                    onChange={() => toggleComplete(todo.id)}
                    className="h-3.5 w-3.5 shrink-0 accent-sky-600 cursor-pointer"
                  />
                )}

                {/* 編集中のときは input、通常は span */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditing(todo.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => saveEditing(todo.id)}
                    autoFocus
                    className="flex-1 rounded border border-sky-300 bg-white px-2 py-1 text-xs text-sky-950 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                ) : (
                  <span
                    className={`flex-1 leading-relaxed ${
                      todo.completed ? "text-gray-400 line-through" : ""
                    }`}
                  >
                    {todo.text}
                  </span>
                )}

                {/* 編集ボタン（✏️） */}
                <button
                  type="button"
                  onClick={() => startEditing(todo)}
                  className="shrink-0 rounded p-1 text-sky-600 opacity-80 transition hover:bg-sky-100 hover:text-sky-700 group-hover:opacity-100"
                  title="編集"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>

                {/* 削除ボタン（🗑️ - SVGのパスをゴミ箱用に修正済み） */}
                <button
                  type="button"
                  onClick={() => onDeleteTodo(todo.id)}
                  className="shrink-0 rounded p-1 text-rose-500 opacity-80 transition hover:bg-rose-100 hover:text-rose-700 group-hover:opacity-100"
                  title="削除"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}