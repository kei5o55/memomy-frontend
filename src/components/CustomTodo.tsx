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
  // todos を state として保持し、初期値に props（またはダミーデータ）を設定
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  // 指定した id の completed を反転（toggle）させる関数
  function toggleComplete(id: number) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  return (
    <div>
      <h4 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600">
        <span className="h-2 w-2 rounded-full bg-sky-500"></span>
        やること
      </h4>
      {todos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-400">やることはありません</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2.5 rounded-lg border border-sky-100 bg-sky-50/40 p-3 text-xs text-sky-950 transition hover:bg-sky-50"
            >
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={todo.completed ?? false}
                  onChange={() => toggleComplete(todo.id)} // クリック時に状態を反転
                  className="h-3.5 w-3.5 shrink-0 accent-sky-600 cursor-pointer"
                />
              )}

              <span className={`leading-relaxed ${todo.completed ? "text-gray-400 line-through" : ""}`}>
                {todo.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}