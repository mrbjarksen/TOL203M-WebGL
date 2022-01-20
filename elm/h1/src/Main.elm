module Main exposing (main)

import Browser
import Html exposing (Html)
import Html.Attributes exposing (height, width)
import Random
import WebGL exposing (Mesh, Shader)
import Math.Vector2 exposing (Vec2, vec2, add, scale, getX, getY)
import Math.Vector4 exposing (Vec4, vec4)

numPoints : Int
numPoints = 50000

-- MAIN --

-- Forritið í heild sinni.
main : Program () (Mesh Vertex) Msg
main = Browser.element
    { init = init
    , update = update
    , view = view 
    , subscriptions = \_ -> Sub.none
    }



-- INIT --

-- Fall sem er kallað á þegar forritið er fyrst keyrt.
-- Í þessu tilviki sendir það skilaboð á keyrsluumhverfið
-- að búa til nýtt mesh. Keyrsluumhverfið beinir þessu
-- á update fallið.
init : () -> (Mesh Vertex, Cmd Msg)
init _ =
    ( WebGL.points []
    , Random.generate NewMesh <| points numPoints
    )

--< Mesh >--

-- Hornpunktar þríhyrningsins
v0 = vec2 -1 -1
v1 = vec2  0  1
v2 = vec2  1 -1

-- Fall til að bæta nýjum punkti við punktalistann
-- fyrir gefið horn sem á að færa síðasta punktinn að.
-- Notað sem hjálparfall í points.
addNextPoint : Vec2 -> List Vec2 -> List Vec2
addNextPoint corner prev =
    case List.head prev of
        Nothing -> []
        Just p -> (scale 0.5 <| add corner p) :: prev

-- Fall sem skilar leið til þess að framleiða
-- slembinn lista af punktum innan þríhyrningsins.
-- Þar sem Elm er hreint (pure) forritunamál
-- getur þetta fall ekki einfaldega skilað lista af
-- punktum eins og t.d. í JavaScript.
points : Int -> Random.Generator (List Vec2)
points n =
    let corners = Random.list n <| Random.uniform v0 [v1, v2]
        u = add v0 v1
        v = add v0 v2
        p = scale 0.25 <| add u v
    in  Random.map (List.foldl addNextPoint [p] >> List.reverse) corners



-- UPDATE --

-- Skilaboð sem keyrsluumhverfið fær.
-- Í þessu tilviki er eina skilaboðið
-- það að búa til nýtt mesh að gefnum
-- lista af punktum.
type Msg = NewMesh (List Vec2)

-- Fall sem tekur skilaboð og núverandi ástand
-- kerfisins og skilar nýju kerfi ásamt
-- skipun til keyrsluumhversins.
update : Msg -> Mesh Vertex -> (Mesh Vertex, Cmd Msg)
update (NewMesh vs) _ =
    ( WebGL.points <| List.map makeVertex vs
    , Cmd.none
    )

-- Fall til að búa til Vertex úr tvívíðum vigri
-- (sjá skilgreiningu á Vertex að neðan).
-- Þetta þarf þar sem Elm styður ekki að
-- senda tvívíðan vigur inn í fjórvítt attribute
-- eins og hægt er að gera í JavaScript (og er
-- gert í JavaScript-útgáfu þessa forrits).
makeVertex : Vec2 -> Vertex
makeVertex v = { vPosition = vec4 (getX v) (getY v) 0 1 }



-- VIEW --

-- Tagið Vertex er notað til að tala við
-- hnútalitarann og inniheldur öll attribute
-- sem notuð eru í honum, með sama nafn og
-- sama tag.
type alias Vertex = { vPosition : Vec4 }

-- View fallið tekur núverandi ástand kerfisins
-- og skilar HTML-kóða til að birta.
view : Mesh Vertex -> Html Msg
view mesh =
    WebGL.toHtml 
        [ width 512
        , height 512 
        ] 
        [ WebGL.entity 
            vertexShader
            fragmentShader
            mesh
            {}
        ]

--< Shaders >--

-- Litarar skrifaðir með venjulegum GLSL-kóða.

vertexShader : Shader Vertex {} {}
vertexShader = [glsl|

attribute vec4 vPosition;

void main() {
    gl_PointSize = 1.0;
    gl_Position = vPosition;
}

|]

fragmentShader : Shader {} {} {}
fragmentShader = [glsl|

precision mediump float;

void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}

|]
