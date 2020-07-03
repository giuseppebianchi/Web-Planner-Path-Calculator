# Planner Path Calculator
This project was assigned in my Software Engineering course, at University of L'Aquila, in collaboration with **Micron Technology Inc.**.
http://mynameisbianchi.herokuapp.com/projects/ppc/

## Demo
https://www.youtube.com/watch?v=tIdqbE1v6vY

## Project Description

The **Planner Path Calculator** is a sub-system of the **Global Planning System** that is used to store and extract planning data modelled as a graph. A **graph** is used to model different manufacturing processes, for example a **Tree** can be used to model the process of making a product as the result of the assembly of multiple components. A Graph is represented in terms of:

- **Vertex** that is the process node and has a Name.

- **Edge** that connects vertices from source vertex to destination vertex.

![Planner Path Calculator](http://mynameisbianchi.herokuapp.com/projects/ppc/graph.png)

Above the conceptual data model. The model must support attributes so that we can associate attributes to vertices and edges. **Attributes** are defined in the **AttributeDefinition** structure. This example includes only two AttributeDefinition (Cost, PTime) but the system should allow the definition of an open set of attributes.

## Requirements
The PPC must have a GUI that generates a tree structure using the following parameters:

> - **Split Size**: how many vertices must be generated from a given vertex.
> - **Depth Size**: the depth of the given tree.
> - **AttributeList**: to specify the list of attributes to associate to Vertex and Edge.
> - **AttributeValueGenerationRule**: to tell the engine how to generate numbers.

In the example above the SplitSize=2 and Depth=3.

The GUI can be used to generate a tree when the “Build Tree” button is pressed. The result is saved in the database. The system needs to be compliant with the database schema provided in this document.

It can be also used to retrieve from the database a Tree previously stored: users can select 2 Vertices A and B, and the system must return the list of vertices from A to B among with the SUM of each attribute. The GUI will also display the time the system took to make this calculation.

The database schema provided is based on MSSQL; in case the team selects a different database they will need to adapt the schema to the selected technology. The team will need to motivate the database technology selection as part of their design decisions.

## Standards, constraints and quality attributes
The system shall be compliant with the following standards, constraints and quality attributes:


#### Company technology roadmap requires:
>- The GUI to be implemented as a Web interface with HTML5 technology.
>- To adopt MSSQL as database technology. Other DBMS can be selected provided that it is open-­source.

#### Performance:
>- Given that this system will be queried by a production system, it should be “fast” to return the result.
>- The system must be able to handle Trees up to 2 million Vertices.
>- We expect a range of 10 to 100 concurrent users that will use this interface concurrently, therefore the system’s architecture should be able to handle the pick load without performance impact.

#### Security:
>- no need to secure the system because it will be embedded in a secured web environment.

## Further Information
More information came out after interviews and questions and we found out more non-functional requirements:

- System response time should be 30 seconds for trees of 1 millions vertices and 60 seconds for 2 millions verteces, being careful about implementation costs of a scaling solution.
- Attributes values can be float or integer.
- There is no need to modify trees.
- System must be optimized about extraction time.
- Each user creates a tree once a week and they are going to consult it three times a day.
- There will be usually three attributes on vertices and three attributes on edges.
- The system will be run on Windows environment.

# Solution
After having analyzed functional and non-functional requirements and the further information, the problem was solved using this following approach:

- To satisfy the non-functional requirements about a faster calculation of path, I though to store in each vertex their own ancestors. So I wrote a recursive function to build tree and its verteces using a "Depth-First Search" logic.

- The solution of building a tree just using the parent reference would have been faster when creating, because documents are smaller, but not good when the user should select two verteces to calculate path. With 2 millions and more verteces, selecting the destination node is not so easy. Respecting the non-functional requirement about extraction and calculation performace I decided to spend more time creating the tree with a solid structure.

- Working with a lot of instances we choose to adopt MongoDB as database, a NoSQL document-oriented solution, because of horizontal scaling.

- User competition are managed by using NGINX and creating a permanent queue for creation requests.


## Result:

When user selects the source vertex, he can choose destination vertex in a list to calculate path. This feature improves user experience.

Retrieving performance are amazing and calculation times are the smallest of the groups that joined the course (0 - 5 ms).
