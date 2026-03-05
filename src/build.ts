const build = async () => {

    await Bun.build({
        entrypoints: ['src/index.ts'],
        outdir: './build',
        sourcemap: "external",
        target: "bun",
    });

    process.exit(0)

}

build()