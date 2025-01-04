from cx_Freeze import setup,Executable

includefiles = ['dormdata.json']
includes = []
excludes = ['']
packages = []
setup(
    name = 'myapp',
    version = '0.1',
    options = {'build_exe': {'includes':includes,'excludes':excludes,'packages':packages,'include_files':includefiles}}, 
    executables = [Executable('genetic.py')]
)
