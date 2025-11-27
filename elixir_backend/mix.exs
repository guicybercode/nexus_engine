defmodule ProjectElixirRustLua.MixProject do
  use Mix.Project

  def project do
    [
      app: :project_elixir_rust_lua,
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      compilers: [:rustler] ++ Mix.compilers(),
      rustler: [
        modules: [
          RustEngine: [
            path: Path.expand("../rust_engine", __DIR__),
            mode: :release
          ]
        ]
      ]
    ]
  end

  def application do
    [
      mod: {ProjectElixirRustLua.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.7.0"},
      {:phoenix_live_view, "~> 0.19.0"},
      {:phoenix_html, "~> 3.3"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:phoenix_live_dashboard, "~> 0.8.0"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:jason, "~> 1.2"},
      {:dns_cluster, "~> 0.1.1"},
      {:plug_cowboy, "~> 2.5"},
      {:rustler, "~> 0.29.0"},
      {:gettext, "~> 0.20"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "cmd cd ../rust_engine && cargo build --release"]
    ]
  end
end
