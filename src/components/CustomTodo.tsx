type Todo = {
  id: string;
  text: string;
  completed?: boolean;
};

type CustomTodoProps = {
  todos?: Todo[];
  showCheckbox?: boolean;
};

export default function CustomTodo({
  todos = [
    { id: "1", text: "やること１" },
    { id: "2", text: "やること２" },
    { id: "3", text: "やること２" },
  ],
  showCheckbox = true,
}: CustomTodoProps) {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700/50">
      <div className="border-b border-slate-700/60 pb-3 mb-4">
        <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">
          Todo List
        </span>
        <h2 className="text-lg font-bold text-slate-100">
          やること
        </h2>
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl"
          >
            {showCheckbox && (
              <input
                type="checkbox"
                checked={todo.completed ?? false}
                readOnly
                className="h-4 w-4 accent-sky-400"
              />
            )}

            <span className="text-sm text-slate-200">
              {todo.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}