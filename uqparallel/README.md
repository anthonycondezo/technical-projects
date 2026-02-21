By Anthony Condezo
# uqparallel

*uqparallel* is a Unix-style process scheduler that dynamically spawns and manages multiple child processes while enforcing a configurable concurrency limit.

## Technical Stack
- C
- POSIX process control (fork, exec, wait)
- Unix pipes and file descriptor management
- Signal handling (SIGCHLD, SIGINT)
- Concurrency control and job limiting
- Command-line argument parsing
- GNU Make

The following methods was used in program:
- dup2()
- kill()
- waitpid() 
- sigaction()

## Project Description

*uqparallel* allows users to run a series of tasks (and/or their arguments) comming from: 
1. The command line
2. A specified file 
3. Standard input (**stdin**)

The program supports: 
- Parallel execution of independent tasks
- Sequential execution through job limiting
- Dynamic pipeline construction between processes
- Controlled early termination on failure
- Dry-run simulation mode

This project demonstrates system-level programming concepts including:
- Process create and lifecycle management
- Inter-process communication via pipes
- Signal-based child process reaping
- Concurrency limiting via active job tracking
- Pipeline construction using file desriptor redirection
- Error progagation and controlled shutdown

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
        2 ps -Uuser2
        3 ps -Uuser3
    ```

**Examples**

a. Execute 2 tasks (in parallel): ```ls -a /etc``` and ```ls -a /usr``` 

    ```bash
        # within terminal 
        ./uqparallel ls -a ::: /etc /usr
    ```

b. Execute 3 tasks (in parallel): ```wc /etc/motd -c```, ```wc /etc/motd -l``` and ```wc /etc/motd -w```

    ```bash
        # within terminal
        ./uqparallel --argsfile ./one wc /etc/motd
    ```
c. Execute pipeline: ```cat /etc/services | grep tcp | wc -l```

    ```bash
        # within terminal
        ./uqparallel --argsfile ./two --pipe
    ```

d. Execute 3 tasks (sequentially): ```whoami```, ```uname``` and ```uptime```

    ```bash
        # within terminal 
        ./uqparallel --limitjobs 1 ::: whoami uname uptime
    ```

e. Execute 3 tasks (in parallel): ```ps -Us1234560```, ```ps -Uuser2``` and ```ps -Uuser3```

    ```bash
        # within terminal
        ./uqparallel --argsfile ./three
    ```

f. Nothing is executed. Rather all three tasks are printed to **stdout**

    ```bash
        # within termianl
        ./uqparallel --argsfile ./three --dry-run
    ```

## Set Up Guide

To compile executable run make witihn project directory.

**NOTE**: Before proceeding, please ensure that your local machine is running a linux distro (e.g. wsl). 



