By Anthony Condezo
# uqparallel

A program which implements a subset of features of GNU parallel - which allows a series of tasks to be parallelised (up to some maximum number of parallel tasks).

## Technical Stack
- C
- GNU Make
//TODO: Add more


## Project Description

*uqparallel* allows users to run a series of tasks in parallel - with the task commands and/or their arguments coming from the command line, a specified file or from **stdin**. *uqparallel* also creates a pipeline of theose commands (the output of one become the input of the next, etc.) and limit the number of processess running in parallel. The tasks may involve the same command (specified on the command line) with different arguments (coming from the command line, **stdin**, or a specified file); or the tasks may each involve different commands.

## Features
All features are exposed via command line arguments.

*uqparallel* accepts command line arguments as follows:

```bash
    # valid terminal line arguments
    ./uqparallel [--limitjobs n] [--pipe] [--halt-on-error] [--dry-run] [--argsfile argument-file] [cmd [fixed-args ...]] [::: per-task-args ...]
```
**NOTE**: Square brackets ([ ]) indicate optional arguments or groups of arguments. Arguments without the  prepending substring "--" indicate placeholder for user-supplied arguments. An ellipsis (...) indicates the previous argument can be repeated. Option arguments and their associated value argument, if any, can be in any order.


**Command Line Argumments**

- --halt-on-error : If this option argument is present, the uqparallel will stop executing tasks if any previous task fails (i.e. doesn't exit normally with status 0).

- --pipe : If this option argument is present then the task must execute as a pipleine, i.e. the output of the first task is piped into the input of the second and so on. 

- --argsfile *argument-file* : If this option argument and value are present then the given *filename* is read to obtain the arguments for each task (or the commands and arguments if no command is specified on the command line).

- --limitjobs *n* : If this option argument and value are present then the number of tasks executed in parallel must not exceed *n* - where *n* must be an integer in the range 1 to 120 inclusive. If this option is not specified then the maximum is 120.

- --dry-run : If this option argument is present then the tasks are not executed, but the commands and arguments for each task will be printed to **stdout**.

- *cmd* [*fixed-args* ...] : If the *cmd* is present (immediately after any option arguments) then this command (and the arguments with it) will form the start of the command line for every task to be executed. The given command cannot begin with **--**. Such an argument would be assumed to be an option argument.

- ::: *per-task-args* ... : If ::: is present on the command line (after any option arguments and any command and fixed arguments) then the arguments following :: will determine the number of tasks to be executed and will be provided as the last command line argument to each task in turn. This element may not be present if **--argsfile** is present.

## Example Usage

For the provided examples, assume the following files contains the following: 

**Example Files**

1. **./one**
    ```text
        1 -c
        2 -l
        3 -w
    ```


2. **./two** 
    ```text
        1 cat /etc/services
        2 grep tcp
        3 wc -l
    ```

3. **./three**
    ```text
        1 ps -Us1234560
        2 ps -Uuser 2
        3 ps -Uuser 3
    ```

**Examples**

a. The following will execute 2 tasks (in parallel): ```ls -a /etc``` and ```ls -a /usr``` 

    ```bash
        # within terminal 
        ./uqparallel ls -a ::: /etc /usr
    ```

b. This will execute 3 tasks (in parallel): ```wc /etc/motd -c```, ```wc /etc/motd -l``` and ```wc /etc/motd -w```

    ```bash
        # within terminal
        ./uqparallel --argsfile ./one wc /etc/motd
    ```
c.

## Set Up Guide

Before proceeding, please ensure that your local machine is running a linux distro (e.g. wsl). 


